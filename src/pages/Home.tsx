import { useState, useCallback } from 'react';
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
import { Sparkles, Save, Send, Plus, Trash2, FileText, DollarSign, Calendar, CreditCard, ShieldCheck, Loader2 } from 'lucide-react';
import { RfpChatModal } from '@/components/RfpChatModal';
import { useApi } from '@/hooks/useApi';

export default function Home() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [generatedRfp, setGeneratedRfp] = useState<any>(null);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);

  // Warranty composite state
  const [warrantyYears, setWarrantyYears] = useState(0);
  const [warrantyMonths, setWarrantyMonths] = useState(0);
  const [deliveryDate, setDeliveryDate] = useState<string>('');

  // API Callbacks
  const saveRfpApi = useCallback(async (rfpData: any) => {
    const res = await axiosInstance.post('/rfp/rfps', rfpData);
    return res.data;
  }, []);

  const fetchVendorsApi = useCallback(async () => {
    const res = await axiosInstance.get('/vendor/vendors');
    return res.data;
  }, []);

  const sendRfpApi = useCallback(async (data: { rfpId: string, vendorIds: string[] }) => {
    await axiosInstance.post(`/rfp/rfps/${data.rfpId}/send`, { vendorIds: data.vendorIds });
  }, []);

  // Hooks
  const { loading: saving, execute: saveRfp } = useApi(saveRfpApi);
  const { data: vendors, loading: vendorsLoading, execute: fetchVendors } = useApi(fetchVendorsApi);
  const { loading: sending, execute: sendRfp } = useApi(sendRfpApi);


  const handleRfpGenerated = (data: any) => {
    setGeneratedRfp(data);
    // Parse warranty if possible
    if (data.warranty) {
        // simple heuristic parsing
        const y = data.warranty.match(/(\d+)\s*ye?a?r?/i);
        const m = data.warranty.match(/(\d+)\s*mo?n?t?h?/i);
        if (y) setWarrantyYears(parseInt(y[1]));
        if (m) setWarrantyMonths(parseInt(m[1]));
    }
    // Parse Delivery Days to Date
    if (data.deliveryDays) {
        const date = new Date();
        date.setDate(date.getDate() + data.deliveryDays);
        setDeliveryDate(date.toISOString().split('T')[0]);
    }
  };

  const updateWarranty = (y: number, m: number) => {
      setWarrantyYears(y);
      setWarrantyMonths(m);
      let str = '';
      if (y > 0) str += `${y} Year${y > 1 ? 's' : ''} `;
      if (m > 0) str += `${m} Month${m > 1 ? 's' : ''}`;
      setGeneratedRfp((prev: any) => ({ ...prev, warranty: str.trim() }));
  };

  const updateDeliveryDate = (dateStr: string) => {
      setDeliveryDate(dateStr);
      if (dateStr) {
          const target = new Date(dateStr);
          const today = new Date();
          const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          setGeneratedRfp((prev: any) => ({ ...prev, deliveryDays: diff > 0 ? diff : 0 }));
      }
  };

  const handleSave = async () => {
    if (!generatedRfp) return;

    if (!generatedRfp.title || !generatedRfp.items?.length || !generatedRfp.paymentTerms || !generatedRfp.warranty || !generatedRfp.deliveryDays) {
        alert("Please fill in all mandatory fields (Title, Items, Payment Terms, Warranty, Delivery Date).");
        return;
    }

    try {
      const savedRfp = await saveRfp(generatedRfp);
      alert('RFP Saved!');
      setGeneratedRfp(savedRfp);
    } catch (error) {
      console.error(error);
      alert('Failed to save RFP');
    }
  };

  const handleOpenVendorModal = () => {
      fetchVendors();
      setIsVendorModalOpen(true);
  }

  const handleSend = async () => {
    if (!generatedRfp) return;

    if (!generatedRfp.title || !generatedRfp.items?.length || !generatedRfp.paymentTerms || !generatedRfp.warranty || !generatedRfp.deliveryDays) {
        alert("Please fill in all mandatory fields before sending.");
        return;
    }

    let rfpId = generatedRfp.id;

    if (!rfpId) {
      try {
        const savedRfp = await saveRfp(generatedRfp);
        rfpId = savedRfp.id;
        setGeneratedRfp(savedRfp);
      } catch (error) {
        console.error(error);
        alert('Failed to auto-save RFP. Please try again.');
        return;
      }
    }

    try {
      await sendRfp({ rfpId, vendorIds: selectedVendors });
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
      items: [...generatedRfp.items, { name: '', quantity: 1, specifications: '' }]
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Create Intelligent RFPs
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start a chat with our AI procurement assistant to generate a structured Request for Proposal in minutes.
        </p>
      </div>

      {!generatedRfp && (
        <Card className="border-t-4 border-t-primary overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => setIsChatOpen(true)}>
          <CardContent className="flex flex-col items-center justify-center py-20 space-y-6">
             <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary" />
             </div>
             <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold">Start AI Assistant</h3>
                <p className="text-muted-foreground max-w-md">Click to open the chat interface. The AI will guide you through defining your requirements.</p>
             </div>
             <Button size="lg" className="rounded-full px-8 text-lg h-12">
                Start Chat
             </Button>
          </CardContent>
        </Card>
      )}

      <RfpChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onGenerate={handleRfpGenerated}
      />

      {generatedRfp && (
        <div className="mt-8">
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="border-b border-border bg-muted/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">Review & Edit RFP</CardTitle>
                  <CardDescription>Review the AI-generated details before saving.</CardDescription>
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSave} variant="outline" className="gap-2" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {generatedRfp.id ? 'Update' : 'Save Draft'}
                  </Button>

                  <Dialog open={isVendorModalOpen} onOpenChange={setIsVendorModalOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleOpenVendorModal} variant="default" className="gap-2">
                        <Send className="h-4 w-4" />
                        Send to Vendors
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Select Vendors</DialogTitle>
                      </DialogHeader>
                      <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                        {vendorsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : !vendors || vendors.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No vendors found.</p>
                        ) : (
                          vendors.map((vendor: any) => (
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
                      <Button onClick={handleSend} disabled={selectedVendors.length === 0 || sending || saving} className="w-full">
                        {sending || saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            `Send Emails (${selectedVendors.length})`
                        )}
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
                    <FileText className="h-4 w-4 text-primary" /> Title <span className="text-destructive">*</span>
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
                  <Label className="text-lg font-semibold">Line Items <span className="text-destructive">*</span></Label>
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
                    <Calendar className="h-4 w-4" /> Delivery Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => updateDeliveryDate(e.target.value)}
                  />
                  {generatedRfp.deliveryDays ? (
                    <span className="text-xs text-muted-foreground">Approx. {generatedRfp.deliveryDays} days</span>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4" /> Payment Terms <span className="text-destructive">*</span>
                  </Label>
                  <select
                     className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                     value={generatedRfp.paymentTerms || ''}
                     onChange={(e) => setGeneratedRfp({...generatedRfp, paymentTerms: e.target.value})}
                  >
                     <option value="">Select Terms</option>
                     <option value="Net 15">Net 15</option>
                     <option value="Net 30">Net 30</option>
                     <option value="Net 60">Net 60</option>
                     <option value="Due on Receipt">Due on Receipt</option>
                     <option value="50% Upfront, 50% on Delivery">50% Upfront, 50% on Delivery</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" /> Warranty <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                            type="number"
                            min="0"
                            value={warrantyYears}
                            onChange={(e) => updateWarranty(parseInt(e.target.value), warrantyMonths)}
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">Yrs</span>
                      </div>
                      <div className="relative flex-1">
                        <Input
                            type="number"
                            min="0"
                            value={warrantyMonths}
                            onChange={(e) => updateWarranty(warrantyYears, parseInt(e.target.value))}
                        />
                         <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">Mos</span>
                      </div>
                  </div>
                  <input type="hidden" value={generatedRfp.warranty || ''} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
