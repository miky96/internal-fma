import React, { useState, useEffect } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, doc, query, orderBy, where, serverTimestamp,
} from 'firebase/firestore';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Snackbar, Alert, TextField,
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Select, MenuItem,
} from '@mui/material';
// eslint-disable-next-line import/extensions
import { db } from '../firebase/firebaseSetup';

interface InventoryEntry {
  id: string;
  name: string;
  quantity: number;
  date: { seconds: number; nanoseconds: number };
}

interface Product {
  id: string;
  name: string;
  category: string;
}

const Inventory: React.FC = () => {
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState<number | string>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [newProductDialogOpen, setNewProductDialogOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');

  useEffect(() => {
    const fetchEntries = async () => {
      const q = query(collection(db, 'inventoryEntries'), orderBy('date'));
      const querySnapshot = await getDocs(q);
      const entriesData = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as InventoryEntry[];
      setEntries(entriesData);
    };

    fetchEntries();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      const q = query(collection(db, 'products'));
      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Product[];
      setProducts(productsData);
    };

    fetchProducts();
  }, []);

  // Helper: get unique categories from products
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Helper: get products by category
  const getProductsByCategory = (category: string) =>
    products.filter((p) => p.category === category).map((p) => p.name);

  const handleOpenDialog = () => {
    setSelectedProduct('');
    setQuantity('');
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const handleSaveEntry = async () => {
    if (!selectedProduct || quantity === '') {
      setSnackbarMessage('Omple tots els camps');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    const now = new Date();
    const entryDate = new Date();
    entryDate.setHours(now.getHours() < 5 ? -1 : 0, 0, 0, 0); // Adjust for 5 AM

    const entryTimestamp = {
      seconds: Math.floor(entryDate.getTime() / 1000),
      nanoseconds: 0,
    };

    try {
      const q = query(
        collection(db, 'inventoryEntries'),
        where('name', '==', selectedProduct),
        where('date', '>=', entryTimestamp),
        where('date', '<', { seconds: entryTimestamp.seconds + 86400, nanoseconds: 0 }),
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingEntry = querySnapshot.docs[0];
        const entryRef = doc(db, 'inventoryEntries', existingEntry.id);
        await updateDoc(entryRef, {
          quantity: Number(quantity),
          date: serverTimestamp(),
        });
        setEntries(entries.map((entry) => (entry.id === existingEntry.id ? { ...entry, quantity: Number(quantity), date: { seconds: Date.now() / 1000, nanoseconds: 0 } } : entry)));
      } else {
        const entryRef = await addDoc(collection(db, 'inventoryEntries'), {
          name: selectedProduct,
          quantity: Number(quantity),
          date: serverTimestamp(),
        });

        setEntries([...entries, {
          id: entryRef.id,
          name: selectedProduct,
          quantity: Number(quantity),
          date: { seconds: Date.now() / 1000, nanoseconds: 0 },
        }]);
      }

      setSnackbarMessage('Producte inventari actualitzat correctament!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseDialog();
    } catch (error) {
      console.error('Error guardant entrada inventari: ', error);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const adjustDateTo5AM = (date: Date): Date => {
    const adjustedDate = new Date(date);
    adjustedDate.setHours(date.getHours() < 5 ? -1 : 0, 0, 0, 0);
    return adjustedDate;
  };

  const groupedEntries = entries.reduce((acc, entry) => {
    const entryDate = new Date(entry.date.seconds * 1000);
    const adjustedDate = adjustDateTo5AM(entryDate).toLocaleDateString();
    if (!acc[adjustedDate]) acc[adjustedDate] = {};
    acc[adjustedDate][entry.name] = entry.quantity;
    return acc;
  }, {} as { [date: string]: { [productName: string]: number } });

  const renderTable = (category: string, categoryName: string) => {
    const productNames = getProductsByCategory(category);
    return (
      <Box mt={4} width="100%">
        <Typography variant="h6" gutterBottom>
          {categoryName}
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                {productNames.map((name) => (
                  <TableCell key={name}>{name}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.keys(groupedEntries).map((date) => (
                <TableRow key={date}>
                  <TableCell>{date}</TableCell>
                  {productNames.map((name) => (
                    <TableCell key={name}>
                      {groupedEntries[date][name] || 0}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  const handleOpenNewProductDialog = () => {
    setNewProductDialogOpen(true);
    setNewProductName('');
    setNewProductCategory('');
  };
  const handleCloseNewProductDialog = () => {
    setNewProductDialogOpen(false);
    setNewProductName('');
    setNewProductCategory('');
  };

  const handleAddNewProduct = async () => {
    if (!newProductName || !newProductCategory) {
      setSnackbarMessage('Omple tots els camps del producte nou');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        name: newProductName,
        category: newProductCategory,
      });
      setProducts([...products, { id: docRef.id, name: newProductName, category: newProductCategory }]);
      setSnackbarMessage('Producte afegit correctament!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseNewProductDialog();
    } catch (e) {
      setSnackbarMessage('Error afegint producte nou');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
      <Typography variant="h4" gutterBottom>
        Inventari
      </Typography>
      <Box display="flex" gap={2} mb={2}>
        <Button variant="contained" color="primary" onClick={handleOpenDialog}>
          Actualitza quantitat
        </Button>
        <Button variant="outlined" color="secondary" onClick={handleOpenNewProductDialog}>
          Nou producte
        </Button>
      </Box>
      {/* Render a table for each category */}
      {categories.map((cat) => renderTable(cat, cat))}
      {/* New Product Dialog */}
      <Dialog open={newProductDialogOpen} onClose={handleCloseNewProductDialog}>
        <DialogTitle>Nou producte</DialogTitle>
        <DialogContent>
          <TextField
            label="Nom"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Categoria"
            value={newProductCategory}
            onChange={(e) => setNewProductCategory(e.target.value)}
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewProductDialog} color="secondary">Cancel·lar</Button>
          <Button onClick={handleAddNewProduct} color="primary">Afegeix</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={open} onClose={handleCloseDialog}>
        <DialogTitle>Afegeix o Actualitza</DialogTitle>
        <DialogContent>
          <Select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="" disabled>
              Selecciona un producte
            </MenuItem>
            {products.map((product) => (
              <MenuItem key={product.id} value={product.name}>
                {product.name}
              </MenuItem>
            ))}
          </Select>
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
            Cancel·lar
          </Button>
          <Button onClick={handleSaveEntry} color="primary">
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
