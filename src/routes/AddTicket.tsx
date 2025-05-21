import React, { useState, useEffect, useContext } from 'react';
import {
  collection, getDocs, addDoc, serverTimestamp,
} from 'firebase/firestore';
import {
  Box, Typography, Grid, Paper, Button, Snackbar, Alert,
  List, ListItem, ListItemText, IconButton,
  TextField, Dialog, DialogActions, DialogContent, DialogTitle,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { db } from '../firebase/firebaseSetup';
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
  const [newProductOrderId, setNewProductOrderId] = useState<number>(0);
  const [newProductImageUrl, setNewProductImageUrl] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      const cachedProducts = localStorage.getItem('products');
      if (cachedProducts) {
        setProducts(JSON.parse(cachedProducts));
      } else {
        const querySnapshot = await getDocs(collection(db, 'ticket_products'));
        const productsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(productsData);
        localStorage.setItem('products', JSON.stringify(productsData));
      }
    };

    fetchProducts();
  }, []);

  const handleAddProductToTicket = (product: Product) => {
    setTicketItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const handleRemoveProductToTicket = (product: Product) => {
    setTicketItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem && existingItem.quantity > 0) {
        return prevItems.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item)).filter((item) => item.quantity > 0);
      }
      return prevItems;
    });
  };

  const handleRemoveTicketItem = (itemId: string) => {
    setTicketItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
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
      setMoneyReceived('');
    } catch (error) {
      console.error('Error guardant ticket: ', error);
      setSnackbarMessage('Error guardant ticket. Torna-ho a intentar.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setMoneyReceived('');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const calculateTotal = () => ticketItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

  const calculateChange = () => {
    const total = parseFloat(calculateTotal());

    if (moneyReceived === '' || Number.isNaN(Number(moneyReceived))) {
      return 0;
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
        order_id: newProductOrderId,
        name: newProductName,
        price: Number(newProductPrice),
        imageUrl: newProductImageUrl,
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

  const sortedProducts = [...products].sort((a, b) => a.order_id - b.order_id);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={4} width="100%">
      <Typography variant="h4" gutterBottom>
        Afegir Tickets
      </Typography>
      {currentUser?.email === 'adminfma@gmail.com' && (
        <Button
          variant="contained"
          color="primary"
          onClick={handleOpenAddProductDialog}
          sx={{ mb: 2, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
        >
          Afegir Producte
        </Button>
      )}
      <Grid container spacing={3} sx={{ width: '100%', maxWidth: 600 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" component="div">
                  Total:
                  {' '}
                  {calculateTotal()}
                  {' '}
                  €
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Diners Rebuts"
                  type="number"
                  value={moneyReceived}
                  onChange={(e) => setMoneyReceived(e.target.value)}
                  fullWidth
                  inputProps={{
                    step: 'any',
                    style: { MozAppearance: 'textfield' },
                  }}
                  inputMode="decimal"
                  sx={{
                    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                    '& input[type=number]': {
                      MozAppearance: 'textfield',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="h6" sx={{ mt: { xs: 2, sm: 0 } }}>
                  Canvi:
                  {' '}
                  {calculateChange()}
                  {' '}
                  €
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveTicket}
                  fullWidth
                  sx={{ mt: { xs: 2, sm: 0 } }}
                >
                  Guardar Ticket
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            Productes
          </Typography>
          <Paper>
            <List>
              {ticketItems.map((item) => (
                <ListItem key={item.id} sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListItemText
                    primary={(
                      <Box display="flex" alignItems="center">
                        <Typography variant="h6">{item.name}</Typography>
                        <Typography variant="h6" sx={{ marginLeft: 2 }}>
                          (
                          {item.quantity}
                          )
                        </Typography>
                      </Box>
                    )}
                  />
                  <Box display="flex" alignItems="center">
                    <Typography variant="h6" sx={{ flexGrow: 1, textAlign: 'right', minWidth: 120 }}>
                      {(item.price * item.quantity)}
                      {' '}
                      €
                    </Typography>
                    <IconButton edge="end" color="secondary" onClick={() => handleRemoveTicketItem(item.id)}>
                      <DeleteIcon sx={{ fontSize: 32 }} />
                    </IconButton>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {sortedProducts.map((product) => (
              <Grid item xs={6} sm={6} md={3} key={product.id}>
                <Paper
                  sx={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '1 / 1', // makes the box square
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 0,
                  }}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1,
                      pointerEvents: 'none', // allow clicks to pass through except for buttons
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 17,
                        left: -6,
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 2,
                        pointerEvents: 'auto',
                      }}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleAddProductToTicket(product)}
                        sx={{
                          minWidth: 0,
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          fontSize: 40,
                          opacity: 0.9,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AddIcon sx={{ fontSize: 40 }} />
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        onClick={() => handleRemoveProductToTicket(product)}
                        sx={{
                          minWidth: 0,
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          fontSize: 40,
                          opacity: 0.9,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <RemoveIcon sx={{ fontSize: 40 }} />
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
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
      <Dialog open={addProductOpen} onClose={handleCloseAddProductDialog} fullWidth maxWidth="sm">
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
          <TextField
            label="Id ordre del producte"
            type="number"
            fullWidth
            value={newProductOrderId}
            onChange={(e) => setNewProductOrderId(Number(e.target.value) || 0)}
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
