import React, { useState, useEffect } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseSetup';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Snackbar, Alert, TextField,
  Button, Dialog, DialogActions, DialogContent, DialogTitle
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

interface Product {
  id: string;
  name: string;
  quantity: number;
  createdAt: { seconds: number; nanoseconds: number };
  updatedAt: { seconds: number; nanoseconds: number };
}

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number | string>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
    };

    fetchProducts();
  }, []);

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setQuantity(product.quantity);
    } else {
      setEditingProduct(null);
      setName('');
      setQuantity('');
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const handleSaveProduct = async () => {
    if (!name || quantity === '') {
      setSnackbarMessage('Omple tots els camps');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      if (editingProduct) {
        const productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, {
          name,
          quantity: Number(quantity),
          updatedAt: serverTimestamp(),
        });
        setProducts(products.map(product => 
          product.id === editingProduct.id ? { ...product, name, quantity: Number(quantity) } : product
        ));
      } else {
        const productRef = await addDoc(collection(db, 'products'), {
          name,
          quantity: Number(quantity),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setProducts([...products, { id: productRef.id, name, quantity: Number(quantity), createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 }, updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } }]);
      }

      setSnackbarMessage(editingProduct ? 'Product editat!' : 'Producte afegit correctament!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseDialog();
    } catch (error) {
      console.error('Error guardant el producte: ', error);
      setSnackbarMessage('Error guardant el producte. Torna a intentar-ho');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        quantity,
        updatedAt: serverTimestamp(),
      });
      setProducts(products.map(product =>
        product.id === productId ? { ...product, quantity } : product
      ));
      setSnackbarMessage('Quantitat actualitzada!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error actualitzant la quantitat: ', error);
      setSnackbarMessage('Error actualitzant la quantitat. Prova un altre vegada.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter(product => product.id !== productId));
      setSnackbarMessage('Producte eliminat correctament!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error al eliminar el producte: ', error);
      setSnackbarMessage('Error al eliminar el producte. Torna a provar.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
      <Typography variant="h4" gutterBottom>
        Inventari
      </Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
        Afegir producte
      </Button>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Quantitat</TableCell>
              <TableCell>Creat</TableCell>
              <TableCell>Actualitzat</TableCell>
              <TableCell>Accions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map(product => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>{new Date(product.createdAt.seconds * 1000).toLocaleString()}</TableCell>
                <TableCell>{new Date(product.updatedAt.seconds * 1000).toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton edge="end" color="primary" onClick={() => handleOpenDialog(product)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" color="secondary" onClick={() => handleDeleteProduct(product.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>{editingProduct ? 'Update Product' : 'Add Product'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Quantitat"
            type="number"
            fullWidth
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel·la
          </Button>
          <Button onClick={handleSaveProduct} color="primary">
            Guarda
          </Button>
        </DialogActions>
      </Dialog>
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

export default Inventory;
