import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '@/lib/axios';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, DollarSign, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApi } from '@/hooks/useApi';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
import { toast } from 'sonner';

export default function RfpList() {
  const [status, setStatus] = useState('Pending');
  const [rfpToDelete, setRfpToDelete] = useState<string | null>(null);

  const fetchRfpsApi = useCallback(async (currentStatus: string) => {
    const res = await axiosInstance.get(`/rfp/rfps?status=${currentStatus}`);
    return res.data;
  }, []);

  const deleteRfpApi = useCallback(async (id: string) => {
      await axiosInstance.delete(`/rfp/rfps/${id}`);
  }, []);

  const { data: rfps, loading, error, execute: fetchRfps } = useApi(fetchRfpsApi);
  const { execute: deleteRfpExec } = useApi(deleteRfpApi);

  useEffect(() => {
    fetchRfps(status);
  }, [status, fetchRfps]);

  const confirmDelete = async () => {
      if(!rfpToDelete) return;

      try {
          await deleteRfpExec(rfpToDelete);
          setRfpToDelete(null);
          fetchRfps(status);
          toast.success('RFP deleted successfully');
      } catch (error) {
          console.error("Failed to delete RFP", error);
          toast.error('Failed to delete RFP');
      }
  }

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.preventDefault(); // Prevent navigating to details
      e.stopPropagation();
      setRfpToDelete(id);
  }


  if(error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Something went wrong</h1>
          <p className="mt-2 text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    )
  }

  const renderRfpList = () => {
      if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
        )
      }

      if (!rfps || rfps.length === 0) {
        return (
            <Card className="border-dashed border-2 flex flex-col items-center justify-center p-12 text-center bg-muted/5">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">No {status === 'Pending' ? 'Active' : 'Closed'} RFPs found</h3>
                <p className="text-muted-foreground mt-2 mb-6 max-w-sm">
                    {status === 'Pending'
                        ? "You don't have any active Request for Proposals."
                        : "You don't have any closed Request for Proposals yet."}
                </p>
                {status === 'Pending' && (
                    <Link to="/">
                        <Button variant="outline">Create your first RFP</Button>
                    </Link>
                )}
            </Card>
        )
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rfps.map((rfp: any) => (
            <Card key={rfp.id} className="flex flex-col hover:shadow-md transition-shadow group relative">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-xl line-clamp-1">
                    {rfp.title || 'Untitled RFP'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={rfp.status === 'Closed' ? "secondary" : "default"}>
                        {rfp.status || status}
                    </Badge>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDeleteClick(e, rfp.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                  {rfp.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4 flex-1">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(rfp.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    {rfp.budget ? `$${rfp.budget.toLocaleString()}` : 'N/A'}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link to={`/rfps/${rfp.id}`} className="w-full">
                  <Button variant="ghost" className="w-full justify-between">
                    View Details
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      );
  }


  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">All RFPs</h1>
          <p className="text-muted-foreground mt-1">Manage and track your request for proposals.</p>
        </div>
        <Link to="/">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Create New RFP
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="Pending" onValueChange={setStatus} className="w-full">
          <TabsList>
            <TabsTrigger value="Pending">Active</TabsTrigger>
            <TabsTrigger value="Closed">Closed</TabsTrigger>
          </TabsList>
          <TabsContent value="Pending" className="mt-6">
            {renderRfpList()}
          </TabsContent>
          <TabsContent value="Closed" className="mt-6">
            {renderRfpList()}
          </TabsContent>
      </Tabs>

      <AlertDialog open={!!rfpToDelete} onOpenChange={() => setRfpToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the RFP
              and remove its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
