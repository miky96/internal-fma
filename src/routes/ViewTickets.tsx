import React, { useState, useEffect, useContext } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebaseSetup';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Snackbar, Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format, addDays } from 'date-fns';
import { AuthContext } from '../context/AuthContext';
import { AggregatedData, Ticket } from '../model/ticket';

const productToRemove = "Got";

const ViewTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const { currentUser } = useContext(AuthContext);

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
        console.error("Error carregant tickets: ", error);
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
    const data: { [date: string]: { [productName: string]: number } & { totalMoney: number } } = {};

    tickets.forEach(ticket => {
      const ticketDate = new Date(ticket.createdAt.seconds * 1000);
      let startOfDay = new Date(ticketDate);
      startOfDay.setHours(5, 0, 0, 0);

      if (ticketDate < startOfDay) {
        startOfDay = addDays(startOfDay, -1);
      }

      const dateKey = format(startOfDay, 'yyyy-MM-dd');

      if (!data[dateKey]) {
        data[dateKey] = { totalMoney: 0 };
      }

      ticket.products.forEach(product => {
        if (product.name !== productToRemove) {
          if (!data[dateKey][product.name]) {
            data[dateKey][product.name] = 0;
          }
          data[dateKey][product.name] += product.quantity;
        }
      });

      data[dateKey].totalMoney += ticket.total;
    });

    return Object.keys(data).map(date => ({
      date,
      products: data[date],
      totalMoney: data[date].totalMoney,
    }));
  };


  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
      <Typography variant="h4" gutterBottom>
        Veure Tickets
      </Typography>
      <Box mt={4} width="100%">
        <Typography variant="h5" gutterBottom>
          Productes diaris venguts
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Data</TableCell>
                {Array.from(new Set(tickets.flatMap(ticket => ticket.products.map(product => product.name))))
                  .filter(productName => productName !== productToRemove)
                  .map(productName => (
                    <TableCell key={productName}>{productName}</TableCell>
                  ))}
                <TableCell>Diners totals</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {aggregatedData.map((data, index) => (
                <TableRow key={index}>
                  <TableCell>{data.date}</TableCell>
                  {Array.from(new Set(tickets.flatMap(ticket => ticket.products.map(product => product.name))))
                    .filter(productName => productName !== productToRemove)
                    .map(productName => (
                      <TableCell key={productName}>
                        {data.products[productName] || 0}
                      </TableCell>
                    ))}
                  <TableCell>{data.totalMoney.toFixed(2)}€</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {currentUser?.email === "adminfma@gmail.com" && (
        <Box mt={4} width="100%">
          <Typography variant="h5" gutterBottom>
            Tickets fets
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
                    <TableCell>€{ticket.total}</TableCell>
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
        </Box>
      )}

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