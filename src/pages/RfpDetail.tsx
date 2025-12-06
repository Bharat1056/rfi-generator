import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, DollarSign, Package, Truck, CreditCard, ShieldCheck, FileText, User, Send, CheckCircle, XCircle } from 'lucide-react';

export default function RfpDetail() {
  const { id } = useParams();
  const [rfp, setRfp] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRfp();
      fetchProposals();
      fetchVendors();
    }
  }, [id]);

  const fetchRfp = async () => {
    try {
      const res = await axiosInstance.get(`/rfp/rfps/${id}`);
      setRfp(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async () => {
    try {
      const res = await axiosInstance.get(`/rfp/rfps/${id}/proposals`);
      setProposals(res.data);
    } catch (error) {
      console.error(error);
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

  const handleSendRfp = async () => {
    if (selectedVendors.length === 0) return;
    setSending(true);
    try {
      await axiosInstance.post(`/rfp/rfps/${id}/send`, { vendorIds: selectedVendors });
      setIsSendDialogOpen(false);
      setSelectedVendors([]);
      alert('RFP sent to selected vendors successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to send RFP');
    } finally {
      setSending(false);
    }
  };

  const toggleVendor = (vendorId: string) => {
    setSelectedVendors(prev =>
      prev.includes(vendorId)
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleConfirm = async (proposalId: string) => {
    if (!confirm('Are you sure you want to confirm this proposal? This will close the RFP.')) return;
    try {
        await axiosInstance.post(`/rfp/rfps/${id}/proposals/${proposalId}/confirm`);
        // Refresh data
        fetchRfp();
        fetchProposals();
    } catch (err) {
        console.error("Failed to confirm", err);
        alert("Failed to confirm proposal");
    }
  }

  const handleReject = async (proposalId: string) => {
    if (!confirm('Are you sure you want to reject this proposal?')) return;
    try {
        await axiosInstance.post(`/rfp/rfps/${id}/proposals/${proposalId}/reject`);
        fetchProposals();
    } catch (err) {
        console.error("Failed to reject", err);
        alert("Failed to reject proposal");
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto animate-pulse">
        <div className="h-8 w-32 bg-muted/20 rounded-md" />
        <div className="h-64 bg-muted/20 rounded-xl" />
        <div className="h-64 bg-muted/20 rounded-xl" />
      </div>
    );
  }

  if (!rfp) return <div>RFP not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <Link to="/rfps">
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to RFPs
          </Button>
        </Link>
        <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Send className="h-4 w-4" /> Send to Vendors
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send RFP to Vendors</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {vendors.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No vendors found.</p>
              ) : (
                vendors.map(vendor => (
                  <div key={vendor.id} className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={vendor.id}
                      checked={selectedVendors.includes(vendor.id)}
                      onCheckedChange={() => toggleVendor(vendor.id)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor={vendor.id} className="cursor-pointer font-medium">
                        {vendor.name}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {vendor.category} • {vendor.email}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSendRfp} disabled={selectedVendors.length === 0 || sending}>
                {sending ? 'Sending...' : `Send to ${selectedVendors.length} Vendor${selectedVendors.length !== 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{rfp.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" /> {new Date(rfp.createdAt).toLocaleDateString()}
            </span>
            <Badge variant={rfp.status === 'Closed' ? "secondary" : "default"} className="bg-primary/10 text-primary">
                {rfp.status || 'Active'}
            </Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Description
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {rfp.description}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="h-4 w-4" /> Budget
              </div>
              <div className="text-2xl font-bold">
                {rfp.budget ? `$${rfp.budget.toLocaleString()}` : 'N/A'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Truck className="h-4 w-4" /> Delivery
              </div>
              <div className="text-2xl font-bold">
                {rfp.deliveryDays ? `${rfp.deliveryDays} Days` : 'N/A'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CreditCard className="h-4 w-4" /> Payment
              </div>
              <div className="text-xl font-bold truncate" title={rfp.paymentTerms}>
                {rfp.paymentTerms || 'N/A'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ShieldCheck className="h-4 w-4" /> Warranty
              </div>
              <div className="text-xl font-bold truncate" title={rfp.warranty}>
                {rfp.warranty || 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Line Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Specifications</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfp.items.map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.qty}</TableCell>
                      <TableCell className="text-muted-foreground">{item.specs}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Vendor Proposals
            </CardTitle>
            <CardDescription>
              {proposals.length} proposal{proposals.length !== 1 ? 's' : ''} received
            </CardDescription>
          </CardHeader>
          <CardContent>
            {proposals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                <p>No proposals received yet.</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>AI Score</TableHead>
                      <TableHead>Total Price</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead>Analysis</TableHead>
                      <TableHead>Status</TableHead>
                      {rfp.status !== 'Closed' && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals.map((p) => (
                      <TableRow key={p.id} className={p.status === 'Accepted' ? 'bg-green-50/50' : ''}>
                        <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <span>{p.vendor.name}</span>
                                <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Badge variant={p.score >= 80 ? "default" : p.score >= 50 ? "secondary" : "destructive"}>
                                    {p.score || 0}/100
                                </Badge>
                            </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {p.totalPrice ? `$${p.totalPrice.toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell>{p.parsedData.deliveryDays ? `${p.parsedData.deliveryDays} Days` : 'N/A'}</TableCell>
                        <TableCell className="max-w-xs text-xs text-muted-foreground">
                            {p.aiAnalysis || 'No analysis available'}
                        </TableCell>
                        <TableCell>
                            <Badge variant={p.status === 'Accepted' ? 'default' : p.status === 'Rejected' ? 'destructive' : 'outline'}>
                                {p.status || 'Pending'}
                            </Badge>
                        </TableCell>
                        {rfp.status !== 'Closed' && (
                            <TableCell className="text-right">
                                {p.status === 'Pending' && (
                                    <div className="flex justify-end gap-2">
                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleReject(p.id)} title="Reject">
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleConfirm(p.id)} title="Confirm & Close RFP">
                                            <CheckCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
