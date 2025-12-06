import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '@/lib/axios';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, DollarSign, Package, Truck, CreditCard, ShieldCheck, FileText, User, Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

export default function RfpDetail() {
  const { id } = useParams();
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);

  // API Callbacks
  const fetchRfpApi = useCallback(async (rfpId: string) => {
    const res = await axiosInstance.get(`/rfp/rfps/${rfpId}`);
    return res.data;
  }, []);

  const fetchProposalsApi = useCallback(async (rfpId: string) => {
    const res = await axiosInstance.get(`/rfp/rfps/${rfpId}/proposals`);
    return res.data;
  }, []);

  const fetchVendorsApi = useCallback(async () => {
    const res = await axiosInstance.get('/vendor/vendors');
    return res.data;
  }, []);

  const sendRfpApi = useCallback(async (data: { rfpId: string, vendorIds: string[] }) => {
    await axiosInstance.post(`/rfp/rfps/${data.rfpId}/send`, { vendorIds: data.vendorIds });
  }, []);

  const confirmProposalApi = useCallback(async (data: { rfpId: string, proposalId: string }) => {
    await axiosInstance.post(`/rfp/rfps/${data.rfpId}/proposals/${data.proposalId}/confirm`);
  }, []);

  const rejectProposalApi = useCallback(async (data: { rfpId: string, proposalId: string }) => {
    await axiosInstance.post(`/rfp/rfps/${data.rfpId}/proposals/${data.proposalId}/reject`);
  }, []);

  // Hooks
  const { data: rfp, loading: rfpLoading, execute: fetchRfp } = useApi(fetchRfpApi);
  const { data: proposals, execute: fetchProposals } = useApi(fetchProposalsApi);
  const { data: vendors, loading: vendorsLoading, execute: fetchVendors } = useApi(fetchVendorsApi);
  const { loading: sending, execute: sendRfp } = useApi(sendRfpApi);
  const { execute: confirmProposal } = useApi(confirmProposalApi);
  const { execute: rejectProposal } = useApi(rejectProposalApi);

  useEffect(() => {
    if (id) {
      fetchRfp(id);
      fetchProposals(id);
    }
  }, [id, fetchRfp, fetchProposals]);

  // Fetch vendors when dialog opens
  useEffect(() => {
    if (isSendDialogOpen) {
        fetchVendors();
    }
  }, [isSendDialogOpen, fetchVendors]);

  const handleSendRfp = async () => {
    if (selectedVendors.length === 0 || !id) return;
    try {
      await sendRfp({ rfpId: id, vendorIds: selectedVendors });
      setIsSendDialogOpen(false);
      setSelectedVendors([]);
      alert('RFP sent to selected vendors successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to send RFP');
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
    if (!confirm('Are you sure you want to confirm this proposal? This will close the RFP.') || !id) return;
    try {
        await confirmProposal({ rfpId: id, proposalId });
        fetchRfp(id);
        fetchProposals(id);
    } catch (err) {
        console.error("Failed to confirm", err);
        alert("Failed to confirm proposal");
    }
  }

  const handleReject = async (proposalId: string) => {
    if (!confirm('Are you sure you want to reject this proposal?') || !id) return;
    try {
        await rejectProposal({ rfpId: id, proposalId });
        fetchProposals(id);
    } catch (err) {
        console.error("Failed to reject", err);
        alert("Failed to reject proposal");
    }
  }

  if (rfpLoading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto animate-pulse p-6">
        <div className="h-8 w-48 bg-muted/20 rounded-md" />
        <div className="h-64 bg-muted/20 rounded-xl" />
        <div className="h-64 bg-muted/20 rounded-xl" />
      </div>
    );
  }

  if (!rfp) return <div className="p-12 text-center">RFP not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 p-6 md:p-0">

      {/* Full Screen Loading Overlay for Sending */}
      {sending && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                  <div className="relative">
                     <div className="h-16 w-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                     <Send className="h-6 w-6 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center">
                      <h3 className="text-lg font-semibold text-foreground">Sending RFP...</h3>
                      <p className="text-sm text-muted-foreground">Notifying {selectedVendors.length} vendors</p>
                  </div>
              </div>
          </div>
      )}

      <div className="flex items-center justify-between">
        <Link to="/rfps">
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to RFPs
          </Button>
        </Link>
        <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all">
              <Send className="h-4 w-4" /> Send to Vendors
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send RFP to Vendors</DialogTitle>
              <DialogDescription>
                  Select vendors to invite to this RFP.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2 space-y-2 max-h-[60vh] overflow-y-auto">
              {vendorsLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-3 text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                      <p className="text-sm">Loading vendors...</p>
                  </div>
              ) : !vendors || vendors.length === 0 ? (
                <div className="text-center py-8">
                     <User className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-20" />
                     <p className="text-muted-foreground">No vendors found.</p>
                     <Button variant="link" className="mt-2" asChild>
                         <Link to="/vendors">Add Vendors</Link>
                     </Button>
                </div>
              ) : (
                vendors.map((vendor: any) => (
                  <div
                    key={vendor.id}
                    className={cn(
                        "flex items-center space-x-3 p-3 rounded-lg border transition-all cursor-pointer",
                        selectedVendors.includes(vendor.id)
                            ? "bg-indigo-50 border-indigo-200"
                            : "hover:bg-muted/50 border-transparent hover:border-border"
                    )}
                    onClick={() => toggleVendor(vendor.id)}
                  >
                    <Checkbox
                      id={vendor.id}
                      checked={selectedVendors.includes(vendor.id)}
                      onCheckedChange={() => toggleVendor(vendor.id)}
                    />
                    <div className="grid gap-1 leading-none">
                      <Label htmlFor={vendor.id} className="cursor-pointer font-medium text-base">
                        {vendor.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {vendor.category} • {vendor.email}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSendRfp}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={selectedVendors.length === 0 || sending}
              >
                {sending ? 'Sending...' : `Send to ${selectedVendors.length} Vendor${selectedVendors.length !== 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{rfp.title}</h1>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-0.5 rounded-full text-sm">
              <Calendar className="h-3.5 w-3.5" /> {new Date(rfp.createdAt).toLocaleDateString()}
            </span>
            <Badge variant={rfp.status === 'Closed' ? "secondary" : "default"} className={cn("px-2.5 py-0.5", rfp.status !== 'Closed' && "bg-green-100 text-green-700 hover:bg-green-200 border-green-200")}>
                {rfp.status || 'Active'}
            </Badge>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-indigo-500" /> Description
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {rfp.description}
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2 text-sm font-medium uppercase tracking-wide">
                <DollarSign className="h-4 w-4" /> Budget
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {rfp.budget ? `$${rfp.budget.toLocaleString()}` : 'N/A'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2 text-sm font-medium uppercase tracking-wide">
                <Truck className="h-4 w-4" /> Delivery
              </div>
              <div className="text-2xl font-bold text-slate-900">
                {rfp.deliveryDays ? `${rfp.deliveryDays} Days` : 'N/A'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2 text-sm font-medium uppercase tracking-wide">
                <CreditCard className="h-4 w-4" /> Payment
              </div>
              <div className="text-xl font-bold text-slate-900 truncate" title={rfp.paymentTerms}>
                {rfp.paymentTerms || 'N/A'}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-muted-foreground mb-2 text-sm font-medium uppercase tracking-wide">
                <ShieldCheck className="h-4 w-4" /> Warranty
              </div>
              <div className="text-xl font-bold text-slate-900 truncate" title={rfp.warranty}>
                {rfp.warranty || 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-indigo-500" /> Line Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
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
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-indigo-500" /> Vendor Proposals
                </CardTitle>
                <CardDescription className="mt-1">
                {proposals?.length || 0} proposal{(proposals?.length || 0) !== 1 ? 's' : ''} received
                </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {!proposals || proposals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Package className="h-10 w-10 mx-auto opacity-20 mb-3" />
                <p>No proposals received yet.</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
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
                    {proposals.map((p: any) => (
                      <TableRow key={p.id} className={p.status === 'Accepted' ? 'bg-green-50/50' : ''}>
                        <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <span className="text-indigo-600 font-medium">{p.vendor.name}</span>
                                <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Badge className={cn(
                                    "font-bold",
                                    p.score >= 80 ? "bg-green-100 text-green-700 hover:bg-green-100" :
                                    p.score >= 50 ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" :
                                    "bg-red-100 text-red-700 hover:bg-red-100"
                                )}>
                                    {p.score || 0}/100
                                </Badge>
                            </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {p.totalPrice ? `$${p.totalPrice.toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell>{p.parsedData.deliveryDays ? `${p.parsedData.deliveryDays} Days` : 'N/A'}</TableCell>
                        <TableCell className="max-w-xs text-xs text-muted-foreground leading-snug">
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
                                        <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleReject(p.id)} title="Reject">
                                            <XCircle className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white shadow-sm" onClick={() => handleConfirm(p.id)} title="Confirm & Close RFP">
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
