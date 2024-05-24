import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseSetup';
import { 
  Box, Typography, Grid, Paper, Button, Snackbar, Alert, 
  List, ListItem, ListItemText, IconButton, ListItemSecondaryAction 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
}

interface TicketItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const AddTicket: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, 'ticket_products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
    };

    fetchProducts();
  }, []);

  const handleAddProductToTicket = (product: Product) => {
    setTicketItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  const handleRemoveTicketItem = (itemId: string) => {
    setTicketItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const handleSaveTicket = async () => {
    if (ticketItems.length === 0) {
      setSnackbarMessage('No products in the ticket.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const total = ticketItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
      await addDoc(collection(db, 'tickets'), {
        products: ticketItems,
        total,
        createdAt: serverTimestamp(),
      });
      setTicketItems([]);
      setSnackbarMessage('Ticket saved successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving ticket: ', error);
      setSnackbarMessage('Failed to save ticket. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const calculateTotal = () => {
    return ticketItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
      <Typography variant="h4" gutterBottom>
        Add Ticket
      </Typography>
      <Grid container spacing={2}>
        {products.map(product => (
          <Grid item xs={6} sm={4} md={3} key={product.id}>
            <Paper
              sx={{
                padding: 1,
                textAlign: 'center',
                cursor: 'pointer',
                height: '150px', // Adjust height as necessary
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
              onClick={() => handleAddProductToTicket(product)}
            >
              <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: 'auto' }} />
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Box mt={4} width="100%">
        <Typography variant="h5" gutterBottom>
          Ticket Items
        </Typography>
        <Paper>
          <List>
            {ticketItems.map(item => (
              <ListItem key={item.id} sx={{ display: 'flex', alignItems: 'center' }}>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center">
                      <Typography variant="h6">{item.name}</Typography>
                      <Typography variant="h6" sx={{ marginLeft: 2 }}>
                        ({item.quantity})
                      </Typography>
                    </Box>
                  }
                />
                <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'right' }}>
                  ${(item.price * item.quantity)}
                </Typography>
                <ListItemSecondaryAction>
                  <IconButton edge="end" color="secondary" onClick={() => handleRemoveTicketItem(item.id)}>
                    <DeleteIcon sx={{ fontSize: 32 }} />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
        <Box mt={2} display="flex" justifyContent="space-between">
          <Typography variant="h6">
            Total: ${calculateTotal()}
          </Typography>
          <Button variant="contained" color="primary" onClick={handleSaveTicket}>
            Save Ticket
          </Button>
        </Box>
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

export default AddTicket;
