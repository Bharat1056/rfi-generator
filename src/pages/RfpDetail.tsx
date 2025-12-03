import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const API_URL = 'http://localhost:4000/api';

export default function RfpDetail() {
  const { id } = useParams();
  const [rfp, setRfp] = useState<any>(null);
  const [proposals, setProposals] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchRfp();
      fetchProposals();
    }
  }, [id]);

  const fetchRfp = async () => {
    try {
      const res = await axios.get(`${API_URL}/rfps/${id}`);
      setRfp(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProposals = async () => {
    try {
      const res = await axios.get(`${API_URL}/rfps/${id}/proposals`);
      setProposals(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (!rfp) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>{rfp.title}</CardTitle>
          <CardDescription>{rfp.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><strong>Budget:</strong> {rfp.budget || 'N/A'}</div>
            <div><strong>Delivery:</strong> {rfp.deliveryDays} days</div>
            <div><strong>Payment:</strong> {rfp.paymentTerms}</div>
            <div><strong>Warranty:</strong> {rfp.warranty}</div>
          </div>

          <h3 className="text-lg font-semibold mb-2">Items</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Specs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfp.items.map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.qty}</TableCell>
                  <TableCell>{item.specs}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          {proposals.length === 0 ? (
            <p className="text-muted-foreground">No proposals received yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Delivery Days</TableHead>
                  <TableHead>Payment Terms</TableHead>
                  <TableHead>Warranty</TableHead>
                  <TableHead>Received At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.vendor.name}</TableCell>
                    <TableCell>{p.totalPrice ? `$${p.totalPrice}` : 'N/A'}</TableCell>
                    <TableCell>{p.parsedData.deliveryDays || 'N/A'}</TableCell>
                    <TableCell>{p.parsedData.paymentTerms || 'N/A'}</TableCell>
                    <TableCell>{p.parsedData.warranty || 'N/A'}</TableCell>
                    <TableCell>{new Date(p.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
