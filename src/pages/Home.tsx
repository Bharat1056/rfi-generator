import { useState } from 'react';
import axiosInstance from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Save, Send, Plus, Trash2, Loader2, FileText, DollarSign, Calendar, CreditCard, ShieldCheck } from 'lucide-react';

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
      const res = await axiosInstance.post('/rfp/rfps/generate', { description });
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
      const res = await axiosInstance.post('/rfp/rfps', generatedRfp);
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
      const res = await axiosInstance.get('/vendor/vendors');
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
      await axiosInstance.post(`/rfp/rfps/${generatedRfp.id}/send`, { vendorIds: selectedVendors });
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
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="text-center space-y-4 mb-12 animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight lg:text-6xl">
          Create <span className="text-gradient">Intelligent</span> RFPs
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Describe your procurement needs in natural language and let AI generate a structured Request for Proposal in seconds.
        </p>
      </div>

      <Card className="glass-card border-t-4 border-t-primary overflow-hidden">
        <CardContent className="space-y-6 pt-8">
          <div className="relative">
            <Textarea
              placeholder="E.g., I need 50 high-end laptops for developers with 32GB RAM, 1TB SSD, and M3 Pro chips. Budget is around $150k. Delivery needed within 30 days..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="resize-none text-base p-6 shadow-inner bg-background/50 focus:bg-background transition-all"
            />
            <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
              {description.length} chars
            </div>
          </div>

          <div className="flex justify-end cursor-pointer">
            <Button
              onClick={handleGenerate}
              disabled={loading || !description}
              variant="gradient"
              size="lg"
              className="w-full sm:w-auto min-w-[200px] text-lg h-12 "
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Structured RFP
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedRfp && (
        <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <Card className="glass-card overflow-hidden">
            <CardHeader className="border-b border-border bg-muted/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">Review & Edit RFP</CardTitle>
                  <CardDescription>Review the AI-generated details before saving.</CardDescription>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSave} variant="outline" className="gap-2">
                    <Save className="h-4 w-4" />
                    {generatedRfp.id ? 'Update' : 'Save Draft'}
                  </Button>

                  <Dialog open={isVendorModalOpen} onOpenChange={setIsVendorModalOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={fetchVendors} variant="default" className="gap-2">
                        <Send className="h-4 w-4" />
                        Send to Vendors
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Select Vendors</DialogTitle>
                      </DialogHeader>
                      <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        {vendors.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No vendors found.</p>
                        ) : (
                          vendors.map((vendor) => (
                            <div key={vendor.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                              <Checkbox
                                id={vendor.id}
                                checked={selectedVendors.includes(vendor.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) setSelectedVendors([...selectedVendors, vendor.id]);
                                  else setSelectedVendors(selectedVendors.filter(id => id !== vendor.id));
                                }}
                              />
                              <div className="grid gap-0.5">
                                <Label htmlFor={vendor.id} className="font-medium cursor-pointer">{vendor.name}</Label>
                                <span className="text-xs text-muted-foreground">{vendor.email}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <Button onClick={handleSend} disabled={selectedVendors.length === 0} className="w-full">
                        Send Emails ({selectedVendors.length})
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Title
                  </Label>
                  <Input
                    value={generatedRfp.title}
                    onChange={(e) => setGeneratedRfp({...generatedRfp, title: e.target.value})}
                    className="text-lg font-medium"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-base font-semibold">Description</Label>
                  <Textarea
                    value={generatedRfp.description}
                    onChange={(e) => setGeneratedRfp({...generatedRfp, description: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg font-semibold">Line Items</Label>
                  <Button variant="outline" size="sm" onClick={addItem} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Item
                  </Button>
                </div>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[25%]">Item Name</TableHead>
                        <TableHead className="w-[15%]">Quantity</TableHead>
                        <TableHead className="w-[50%]">Specifications</TableHead>
                        <TableHead className="w-[10%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generatedRfp.items.map((item: any, i: number) => (
                        <TableRow key={i} className="group">
                          <TableCell>
                            <Input
                              value={item.name}
                              onChange={(e) => updateItem(i, 'name', e.target.value)}
                              className="bg-transparent border-transparent focus:bg-background focus:border-input"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateItem(i, 'qty', parseInt(e.target.value))}
                              className="bg-transparent border-transparent focus:bg-background focus:border-input"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.specs}
                              onChange={(e) => updateItem(i, 'specs', e.target.value)}
                              className="bg-transparent border-transparent focus:bg-background focus:border-input"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteItem(i)}
                              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-muted/30 rounded-xl border border-border">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" /> Budget
                  </Label>
                  <Input
                    type="number"
                    value={generatedRfp.budget || ''}
                    onChange={(e) => setGeneratedRfp({...generatedRfp, budget: parseFloat(e.target.value)})}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" /> Delivery Days
                  </Label>
                  <Input
                    type="number"
                    value={generatedRfp.deliveryDays || ''}
                    onChange={(e) => setGeneratedRfp({...generatedRfp, deliveryDays: parseInt(e.target.value)})}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4" /> Payment Terms
                  </Label>
                  <Input
                    value={generatedRfp.paymentTerms || ''}
                    onChange={(e) => setGeneratedRfp({...generatedRfp, paymentTerms: e.target.value})}
                    placeholder="Net 30"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" /> Warranty
                  </Label>
                  <Input
                    value={generatedRfp.warranty || ''}
                    onChange={(e) => setGeneratedRfp({...generatedRfp, warranty: e.target.value})}
                    placeholder="1 Year"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
