import { useEffect, useRef, useState } from 'react';
import axiosInstance from '@/lib/axios';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, DollarSign, ArrowRight, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function RfpList() {
  const [rfps, setRfps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchRef = useRef(false)

  useEffect(() => {
    const fetchRfps = async () => {
      if(fetchRef.current) return
      try {
        fetchRef.current = true
        const res = await axiosInstance.get('/rfp/rfps');
        setRfps(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
        fetchRef.current = false
      }
    };
    fetchRfps();
  }, []);


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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : (rfps.length === 0 && !loading) ? (
        <Card className="border-dashed border-2 flex flex-col items-center justify-center p-12 text-center bg-muted/5">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">No RFPs found</h3>
          <p className="text-muted-foreground mt-2 mb-6 max-w-sm">
            You haven't created any Request for Proposals yet. Start by creating your first one.
          </p>
          <Link to="/">
            <Button variant="outline">Create your first RFP</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rfps.map((rfp) => (
            <Card key={rfp.id} className="flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-xl line-clamp-1">
                    {rfp.title || 'Untitled RFP'}
                  </CardTitle>
                  <Badge variant="secondary">Active</Badge>
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
      )}
    </div>
  );
}
