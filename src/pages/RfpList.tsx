import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

const API_URL = 'http://localhost:4000/api';

export default function RfpList() {
  const [rfps, setRfps] = useState<any[]>([]);

  useEffect(() => {
    fetchRfps();
  }, []);

  const fetchRfps = async () => {
    try {
      const res = await axios.get(`${API_URL}/rfps`);
      setRfps(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All RFPs</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rfps.map((rfp) => (
              <TableRow key={rfp.id}>
                <TableCell className="font-medium">{rfp.title}</TableCell>
                <TableCell>{new Date(rfp.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{rfp.budget ? `$${rfp.budget}` : 'N/A'}</TableCell>
                <TableCell>
                  <Link to={`/rfps/${rfp.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
