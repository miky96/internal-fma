import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebaseSetup';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Snackbar, Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';

interface Ticket {
  id: string;
  products: { id: number; name: string; quantity: number; price: number }[];
  total: number;
  createdAt: { seconds: number; nanoseconds: number };
}

interface AggregatedData {
  date: string;
  products: { [productName: string]: number };
}

const ViewTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'tickets'));
        const ticketsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Ticket[];
        setTickets(ticketsData);
        setAggregatedData(aggregateData(ticketsData));
      } catch (error) {
        console.error("Error fetching tickets: ", error);
      }
    };

    fetchTickets();
  }, []);

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await deleteDoc(doc(db, 'tickets', ticketId));
      const updatedTickets = tickets.filter(ticket => ticket.id !== ticketId);
      setTickets(updatedTickets);
      setAggregatedData(aggregateData(updatedTickets));
      setSnackbarMessage('Ticket borrat correctament!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error eliminant document: ', error);
      setSnackbarMessage('Error eliminant ticket. Torna-ho a intentar.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const aggregateData = (tickets: Ticket[]): AggregatedData[] => {
    const data: { [date: string]: { [productName: string]: number } } = {};

    tickets.forEach(ticket => {
      const date = format(new Date(ticket.createdAt.seconds * 1000), 'yyyy-MM-dd');
      if (!data[date]) {
        data[date] = {};
      }
      ticket.products.forEach(product => {
        if (!data[date][product.name]) {
          data[date][product.name] = 0;
        }
        data[date][product.name] += product.quantity;
      });
    });

    return Object.keys(data).map(date => ({
      date,
      products: data[date],
    }));
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
      <Typography variant="h4" gutterBottom>
        Veure Tickets
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Productes</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Creat</TableCell>
              <TableCell>Accions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.map(ticket => (
              <TableRow key={ticket.id}>
                <TableCell>
                  {ticket.products.map(product => (
                    <div key={product.id}>
                      {product.name} (x{product.quantity})
                    </div>
                  ))}
                </TableCell>
                <TableCell>${ticket.total}</TableCell>
                <TableCell>{format(new Date(ticket.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm')}</TableCell>
                <TableCell>
                  <IconButton edge="end" color="secondary" onClick={() => handleDeleteTicket(ticket.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box mt={4} width="100%">
        <Typography variant="h5" gutterBottom>
          Productes diaris venguts
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                {Array.from(new Set(tickets.flatMap(ticket => ticket.products.map(product => product.name)))).map(productName => (
                  <TableCell key={productName}>{productName}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {aggregatedData.map((data, index) => (
                <TableRow key={index}>
                  <TableCell>{data.date}</TableCell>
                  {Array.from(new Set(tickets.flatMap(ticket => ticket.products.map(product => product.name)))).map(productName => (
                    <TableCell key={productName}>
                      {data.products[productName] || 0}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ViewTickets;