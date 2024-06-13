import React, { useState, useEffect } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, doc, query, orderBy, where, serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebaseSetup';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Snackbar, Alert, TextField,
  Button, Dialog, DialogActions, DialogContent, DialogTitle, Select, MenuItem
} from '@mui/material';

import { Makro, OtherProducts, Alcohol, ProductNames } from '../model/inventory';

interface InventoryEntry {
  id: string;
  name: string;
  quantity: number;
  date: { seconds: number; nanoseconds: number };
}

const Inventory: React.FC = () => {
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState<number | string>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchEntries = async () => {
      const q = query(collection(db, 'inventoryEntries'), orderBy('date'));
      const querySnapshot = await getDocs(q);
      const entriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryEntry[];
      setEntries(entriesData);
    };

    fetchEntries();
  }, []);

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
      nanoseconds: 0
    };

    try {
      const q = query(
        collection(db, 'inventoryEntries'),
        where('name', '==', selectedProduct),
        where('date', '>=', entryTimestamp),
        where('date', '<', { seconds: entryTimestamp.seconds + 86400, nanoseconds: 0 })
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingEntry = querySnapshot.docs[0];
        const entryRef = doc(db, 'inventoryEntries', existingEntry.id);
        await updateDoc(entryRef, {
          quantity: Number(quantity),
          date: serverTimestamp(),
        });
        setEntries(entries.map(entry =>
          entry.id === existingEntry.id ? { ...entry, quantity: Number(quantity), date: { seconds: Date.now() / 1000, nanoseconds: 0 } } : entry
        ));
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
          date: { seconds: Date.now() / 1000, nanoseconds: 0 }
        }]);
      }

      setSnackbarMessage('Entry added/updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving the entry: ', error);
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

  const renderTable = (category: string[], categoryName: string) => (
    <Box mt={4} width="100%">
      <Typography variant="h6" gutterBottom>
        {categoryName}
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              {category.map(name => (
                <TableCell key={name}>{name}</TableCell>
              ))}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.keys(groupedEntries).map(date => (
              <TableRow key={date}>
                <TableCell>{date}</TableCell>
                {category.map(name => (
                  <TableCell key={name}>
                    {groupedEntries[date][name] || 0}
                  </TableCell>
                ))}
                <TableCell>
                  {/* Add any additional actions here, such as delete */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
      <Typography variant="h4" gutterBottom>
        Inventari
      </Typography>
      <Button variant="contained" color="primary" onClick={handleOpenDialog}>
      Afegeix o Actualitza
      </Button>
      {renderTable(Alcohol, 'Alcohol')}
      {renderTable(OtherProducts, 'Altres Productes')}
      {renderTable(Makro, 'Menjar')}
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
            {ProductNames.map(name => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
          <TextField
            margin="dense"
            label="Quantity"
            type="number"
            fullWidth
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="secondary">
            Cancel
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
