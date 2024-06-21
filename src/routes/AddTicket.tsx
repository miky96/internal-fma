import React, { useState, useEffect, useContext } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebaseSetup';
import {
  Box, Typography, Grid, Paper, Button, Snackbar, Alert,
  List, ListItem, ListItemText, IconButton,
  TextField, Dialog, DialogActions, DialogContent, DialogTitle
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { AuthContext } from '../context/AuthContext';
import { Product, TicketItem } from '../model/ticket';

const AddTicket: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [moneyReceived, setMoneyReceived] = useState<string>('');
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number | string>('');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      const cachedProducts = localStorage.getItem('products_new');
      if (cachedProducts) {
        setProducts(JSON.parse(cachedProducts));
      } else {
        const querySnapshot = await getDocs(collection(db, 'ticket_products'));
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productsData);
        localStorage.setItem('products', JSON.stringify(productsData));
      }
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

  const handleRemoveProductToTicket = (product: Product) => {
    setTicketItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem && existingItem.quantity > 0) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item
        ).filter(item => item.quantity > 0);
      }
      return prevItems;
    });
  };

  const handleRemoveTicketItem = (itemId: string) => {
    setTicketItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };

  const handleSaveTicket = async () => {
    if (ticketItems.length === 0) {
      setSnackbarMessage('Encara no hi ha cap producte al ticket.');
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
      setSnackbarMessage('Ticket guardat correcatment!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setMoneyReceived('0');
    } catch (error) {
      console.error('Error guardant ticket: ', error);
      setSnackbarMessage('Error guardant ticket. Torna-ho a intentar.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setMoneyReceived('0');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const calculateTotal = () => {
    return ticketItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
  };

  const calculateChange = () => {
    const total = parseFloat(calculateTotal());

    if (Number.isNaN(moneyReceived) || moneyReceived === '') {
      return 0
    }

    return (parseFloat(moneyReceived) - total).toFixed(2);
  };

  const handleOpenAddProductDialog = () => {
    setNewProductName('');
    setNewProductPrice('');
    setNewProductImageUrl('');
    setAddProductOpen(true);
  };

  const handleCloseAddProductDialog = () => {
    setAddProductOpen(false);
  };

  const handleSaveNewProduct = async () => {
    if (!newProductName || newProductPrice === '' || !newProductImageUrl) {
      setSnackbarMessage('Omple tots els camps.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      const newProduct = {
        name: newProductName,
        price: Number(newProductPrice),
        imageUrl: newProductImageUrl
      };

      const productRef = await addDoc(collection(db, 'ticket_products'), newProduct);

      setProducts([...products, { id: productRef.id, ...newProduct }]);
      setSnackbarMessage('Producte afegit correctament!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseAddProductDialog();
    } catch (error) {
      console.error('Error guardant el producte: ', error);
      setSnackbarMessage('Error guardant el producte. Torna-ho a intentar.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
      <Typography variant="h4" gutterBottom>
        Afegir Tickets
      </Typography>
      {currentUser?.email === "adminfma@gmail.com" && (<Button variant="contained" color="primary" onClick={handleOpenAddProductDialog}>
        Afegir Producte
      </Button>
      )}
      <Box mt={4} width="100%">
        <Box mt={2} display="flex" flexDirection="column" alignItems="flex-start">
          <Typography variant="h6">
            Total: {calculateTotal()} €
          </Typography>
          <TextField
            label="Diners Rebuts"
            type="number"
            value={moneyReceived}
            onChange={(e) => setMoneyReceived(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Canvi: {calculateChange()} €
          </Typography>
          <Button variant="contained" color="primary" onClick={handleSaveTicket} sx={{ mt: 2 }}>
            Guardar Ticket
          </Button>
        </Box>
        <Box mt={2}>
          <Typography variant="h5" gutterBottom>
            Productes
          </Typography>
        </Box>
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
                <Box display="flex" alignItems="center">
                  <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'right' }}>
                    {(item.price * item.quantity)} €
                  </Typography>
                  <IconButton edge="end" color="secondary" onClick={() => handleRemoveTicketItem(item.id)}>
                    <DeleteIcon sx={{ fontSize: 32 }} />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        </Paper>
        <Grid container spacing={2} mt={2}>
          {products.map(product => (
            <Grid item xs={6} sm={4} md={3} key={product.id}>
              <Paper
                sx={{
                  padding: 1,
                  textAlign: 'center',
                  height: '200px', // Adjust height as necessary
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: 'auto' }} />
                <Box sx={{ marginTop: 1, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Button variant="contained" color="primary" onClick={() => handleAddProductToTicket(product)}>
                    <AddIcon />
                  </Button>
                  <Button variant="contained" color="secondary" onClick={() => handleRemoveProductToTicket(product)}>
                    <RemoveIcon />
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
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
      <Dialog open={addProductOpen} onClose={handleCloseAddProductDialog}>
        <DialogTitle>Afegir Nou Producte</DialogTitle>
        <DialogContent>
          <TextField
            label="Nom del Producte"
            fullWidth
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Preu del Producte"
            type="number"
            fullWidth
            value={newProductPrice}
            onChange={(e) => setNewProductPrice(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            label="URL de la Imatge"
            fullWidth
            value={newProductImageUrl}
            onChange={(e) => setNewProductImageUrl(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddProductDialog} color="secondary">
            Cancel·lar
          </Button>
          <Button onClick={handleSaveNewProduct} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddTicket;
