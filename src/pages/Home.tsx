import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:4000/api';

export default function Home() {
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedRfp, setGeneratedRfp] = useState<any>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  const handleGenerate = async () => {
    if (!description) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/rfps/generate`, { description });
      setGeneratedRfp(res.data);
    } catch (error) {
      console.error(error);
      alert('Failed to generate RFP');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedRfp) return;
    try {
      const res = await axios.post(`${API_URL}/rfps`, generatedRfp);
      alert('RFP Saved!');
      // Update with ID so we can send it
      setGeneratedRfp(res.data);
    } catch (error) {
      console.error(error);
      alert('Failed to save RFP');
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${API_URL}/vendors`);
      setVendors(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = async () => {
    if (!generatedRfp?.id) {
      alert('Please save the RFP first');
      return;
    }
    try {
      await axios.post(`${API_URL}/rfps/${generatedRfp.id}/send`, { vendorIds: selectedVendors });
      alert('RFP sent to vendors!');
      setIsVendorModalOpen(false);
      navigate('/rfps');
    } catch (error) {
      console.error(error);
      alert('Failed to send RFP');
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...generatedRfp.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setGeneratedRfp({ ...generatedRfp, items: newItems });
  };

  const deleteItem = (index: number) => {
    const newItems = generatedRfp.items.filter((_: any, i: number) => i !== index);
    setGeneratedRfp({ ...generatedRfp, items: newItems });
  };

  const addItem = () => {
    setGeneratedRfp({
      ...generatedRfp,
      items: [...generatedRfp.items, { name: '', qty: 1, specs: '' }]
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create New RFP</CardTitle>
          <CardDescription>Describe your procurement needs in natural language.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="E.g., I need 50 high-end laptops for developers with 32GB RAM and 1TB SSD..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Structured RFP'}
          </Button>
        </CardContent>
      </Card>

      {generatedRfp && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Edit RFP</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input
                  value={generatedRfp.title}
                  onChange={(e) => setGeneratedRfp({...generatedRfp, title: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={generatedRfp.description}
                  onChange={(e) => setGeneratedRfp({...generatedRfp, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label>Items</Label>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Specs</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedRfp.items.map((item: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Input value={item.name} onChange={(e) => updateItem(i, 'name', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={item.qty} onChange={(e) => updateItem(i, 'qty', parseInt(e.target.value))} />
                        </TableCell>
                        <TableCell>
                          <Input value={item.specs} onChange={(e) => updateItem(i, 'specs', e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <Button variant="destructive" size="sm" onClick={() => deleteItem(i)}>X</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button variant="outline" size="sm" onClick={addItem}>Add Item</Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Budget</Label>
                  <Input
                    type="number"
                    value={generatedRfp.budget || ''}
                    onChange={(e) => setGeneratedRfp({...generatedRfp, budget: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Delivery Days</Label>
                  <Input
                    type="number"
                    value={generatedRfp.deliveryDays || ''}
                    onChange={(e) => setGeneratedRfp({...generatedRfp, deliveryDays: parseInt(e.target.value)})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Payment Terms</Label>
                  <Input
                    value={generatedRfp.paymentTerms || ''}
                    onChange={(e) => setGeneratedRfp({...generatedRfp, paymentTerms: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Warranty</Label>
                  <Input
                    value={generatedRfp.warranty || ''}
                    onChange={(e) => setGeneratedRfp({...generatedRfp, warranty: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleSave} variant="secondary">
                {generatedRfp.id ? 'Update RFP' : 'Save RFP'}
              </Button>

              <Dialog open={isVendorModalOpen} onOpenChange={setIsVendorModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={fetchVendors}>Send to Vendors</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select Vendors</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    {vendors.map((vendor) => (
                      <div key={vendor.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={vendor.id}
                          checked={selectedVendors.includes(vendor.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedVendors([...selectedVendors, vendor.id]);
                            else setSelectedVendors(selectedVendors.filter(id => id !== vendor.id));
                          }}
                        />
                        <Label htmlFor={vendor.id}>{vendor.name} ({vendor.email})</Label>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleSend} disabled={selectedVendors.length === 0}>
                    Send Emails
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
