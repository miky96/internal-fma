import React, { useContext, useEffect, useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import {
  collection, getDocs, updateDoc, doc, addDoc,
} from 'firebase/firestore';
import {
  Box, Typography, Grid, Paper, Button, Snackbar, Alert,
  Dialog, DialogActions, DialogContent, DialogTitle, TextField, MenuItem,
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/firebaseSetup';
import { Product, ProductTypes, ProductTypesNames } from '../model/ticket';

const EditProduct: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number | string>('');
  const [editOrderId, setEditOrderId] = useState<number>(0);
  const [editType, setEditType] = useState<ProductTypes>(ProductTypes.BARRA);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number | string>('');
  const [newProductOrderId, setNewProductOrderId] = useState<number>(0);
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const [newProductType, setNewProductType] = useState(ProductTypes.BARRA);

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, 'ticket_products'));
      const productsData = querySnapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Product[];
      setProducts(productsData);
    };
    fetchProducts();
  }, []);

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setEditName(product.name);
    setEditPrice(product.price);
    setEditOrderId(product.order_id);
    setEditType(product.type);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleSaveEdit = async () => {
    if (!selectedProduct) return;
    if (!editName || editPrice === '') {
      setSnackbarMessage('Omple tots els camps.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    try {
      const productRef = doc(db, 'ticket_products', selectedProduct.id);
      await updateDoc(productRef, {
        name: editName,
        price: Number(editPrice),
        order_id: editOrderId,
        type: editType,
      });
      localStorage.removeItem('all_products');

      setProducts((prev) => prev.map((p) => (p.id === selectedProduct.id
        ? {
          ...p, name: editName, price: Number(editPrice), order_id: editOrderId, type: editType,
        }
        : p)));
      setSnackbarMessage('Producte actualitzat correctament!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseEditDialog();
    } catch (error) {
      setSnackbarMessage('Error actualitzant el producte.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
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
      // Create product object without id (let Firestore generate it)
      const newProduct = {
        order_id: newProductOrderId,
        name: newProductName,
        price: Number(newProductPrice),
        imageUrl: newProductImageUrl,
        type: newProductType,
      };

      const productRef = await addDoc(collection(db, 'ticket_products'), newProduct);
      localStorage.removeItem('all_products');
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

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  const handleOpenAddProductDialog = () => {
    setNewProductName('');
    setNewProductPrice('');
    setNewProductImageUrl('');
    setNewProductType(ProductTypes.BARRA);
    setAddProductOpen(true);
  };

  const renderTypeOptions = (): JSX.Element[] => Object.keys(ProductTypesNames).map((key) => {
    const type = parseInt(key, 10) as ProductTypes;
    const typeName = ProductTypesNames[type];
    return (
      <MenuItem key={type} value={type}>
        {typeName}
      </MenuItem>
    );
  });

  const sortedProducts = [...products].sort((a, b) => a.order_id - b.order_id);
  const barraProducts = sortedProducts.filter((product) => product.type === ProductTypes.BARRA);
  const merchandisingProducts = sortedProducts.filter((product) => product.type === ProductTypes.MERCHANDISING);

  const renderProductGrid = (productList: Product[]) => (
    <Grid container spacing={2}>
      {productList.map((product) => (
        <Grid item xs={6} sm={6} md={3} key={product.id}>
          <Paper
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1',
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
                justifyContent: 'center',
                alignItems: 'center',
                p: 1,
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleEditClick(product)}
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
                <EditIcon sx={{ fontSize: 40 }} />
              </Button>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={4} width="100%">
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
      <Typography variant="h4" gutterBottom>
        Editar Productes
      </Typography>
      <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
        {ProductTypesNames[ProductTypes.BARRA]}
      </Typography>
      {renderProductGrid(barraProducts)}
      <Typography variant="h5" sx={{ mt: 4, mb: 1 }}>
        {ProductTypesNames[ProductTypes.MERCHANDISING]}
      </Typography>
      {renderProductGrid(merchandisingProducts)}

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

      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} fullWidth maxWidth="sm">
        <DialogTitle>Edita el Producte</DialogTitle>
        <DialogContent>
          <TextField
            label="Nom del Producte"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Preu del Producte"
            type="number"
            fullWidth
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            sx={{
              '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]': {
                MozAppearance: 'textfield',
              },
              mt: 2,
            }}
          />
          <TextField
            label="Tipus de producte"
            fullWidth
            select
            value={editType}
            type="number"
            onChange={(e) => setEditType(e.target.value as unknown as ProductTypes)}
            sx={{ mt: 2 }}
          >
            {renderTypeOptions()}
          </TextField>
          <TextField
            label="Id ordre del producte"
            type="number"
            fullWidth
            value={editOrderId}
            onChange={(e) => setEditOrderId(Number(e.target.value) || 0)}
            sx={{
              '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]': {
                MozAppearance: 'textfield',
              },
              mt: 2,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog} color="secondary">
            Cancel·lar
          </Button>
          <Button onClick={handleSaveEdit} color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
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
            sx={{
              '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]': {
                MozAppearance: 'textfield',
              },
              mt: 2,
            }}
          />
          <TextField
            label="URL de la Imatge"
            fullWidth
            value={newProductImageUrl}
            onChange={(e) => setNewProductImageUrl(e.target.value)}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Tipus de producte"
            fullWidth
            select
            value={newProductType}
            type="number"
            onChange={(e) => setNewProductType(e.target.value as unknown as ProductTypes)}
            sx={{ mt: 2 }}
          >
            {renderTypeOptions()}
          </TextField>
          <TextField
            label="Id ordre del producte"
            type="number"
            fullWidth
            value={newProductOrderId}
            onChange={(e) => setNewProductOrderId(Number(e.target.value) || 0)}
            sx={{
              '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]': {
                MozAppearance: 'textfield',
              },
              mt: 2,
            }}
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

export default EditProduct;
