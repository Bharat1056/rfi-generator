import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Users, Mail, Tag, Search, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/hooks/useApi';

export default function Vendors() {
  const [newVendor, setNewVendor] = useState({ name: '', email: '', category: '' });
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // API Callbacks
  const fetchVendorsApi = useCallback(async () => {
    const res = await axiosInstance.get('/vendor/vendors');
    return res.data;
  }, []);

  const createVendorApi = useCallback(async (vendorData: typeof newVendor) => {
    await axiosInstance.post('/vendor/vendors', vendorData);
  }, []);

  // Hooks
  const { data: vendors, loading, execute: fetchVendors } = useApi(fetchVendorsApi);
  const { loading: creating, execute: createVendor } = useApi(createVendorApi);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleCreate = async () => {
    try {
      await createVendor(newVendor);
      setIsOpen(false);
      setNewVendor({ name: '', email: '', category: '' });
      fetchVendors();
    } catch (error) {
      console.error(error);
      alert('Failed to create vendor');
    }
  };

  const filteredVendors = vendors?.filter((v: any) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Vendor Management</h1>
          <p className="text-muted-foreground mt-1">Manage your supplier database and contacts.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                  placeholder="contact@acme.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newVendor.category}
                  onChange={(e) => setNewVendor({...newVendor, category: e.target.value})}
                  placeholder="Hardware, Software, Services..."
                />
              </div>
              <Button onClick={handleCreate} className="w-full mt-2" disabled={creating}>
                  {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Vendor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vendors..."
          className="pl-10 max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 rounded-lg bg-muted/20 animate-pulse border border-muted" />
          ))}
        </div>
      ) : (filteredVendors.length === 0 && !loading) ? (
        <Card className="border-dashed border-2 flex flex-col items-center justify-center p-12 text-center bg-muted/5">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">No vendors found</h3>
          <p className="text-muted-foreground mt-2 mb-6 max-w-sm">
            {searchTerm ? 'Try adjusting your search terms.' : 'Add your first vendor to get started.'}
          </p>
          {!searchTerm && (
            <Button variant="outline" onClick={() => setIsOpen(true)}>Add Vendor</Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor: any) => (
            <Card key={vendor.id} className="hover:shadow-md transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {vendor.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{vendor.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" /> {vendor.email}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="secondary" className="group-hover:bg-secondary/80">
                    <Tag className="h-3 w-3 mr-1" />
                    {vendor.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
