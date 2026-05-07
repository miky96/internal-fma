import React, { useContext, useEffect, useState } from 'react';
import {
  collection, getDocs, updateDoc, doc, addDoc,
} from 'firebase/firestore';
import {
  Stack, Title, Group, Grid, Paper, Button, ActionIcon, TextInput, NumberInput, Select, Modal,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconEdit } from '@tabler/icons-react';
import { AuthContext } from '../context/AuthContext';
import { db } from '../firebase/firestore';
import { Product, ProductTypes, ProductTypesNames } from '../model/ticket';

const showError = (message: string) => notifications.show({ color: 'red', message });
const showOk = (message: string) => notifications.show({ color: 'green', message });

const typeSelectData = Object.keys(ProductTypesNames).map((key) => {
  const t = parseInt(key, 10) as ProductTypes;
  return { value: String(t), label: ProductTypesNames[t] };
});

const EditProduct: React.FC = () => {
  const { currentUser } = useContext(AuthContext);
  const [products, setProducts] = useState<Product[]>([]);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number | string>('');
  const [editOrderId, setEditOrderId] = useState<number | string>(0);
  const [editType, setEditType] = useState<ProductTypes>(ProductTypes.BARRA);

  const [addProductOpen, setAddProductOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number | string>('');
  const [newProductOrderId, setNewProductOrderId] = useState<number | string>(0);
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const [newProductType, setNewProductType] = useState<ProductTypes>(ProductTypes.BARRA);

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
      showError('Omple tots els camps.');
      return;
    }
    try {
      const productRef = doc(db, 'ticket_products', selectedProduct.id);
      await updateDoc(productRef, {
        name: editName,
        price: Number(editPrice),
        order_id: Number(editOrderId) || 0,
        type: editType,
      });
      localStorage.removeItem('all_products');

      setProducts((prev) => prev.map((p) => (p.id === selectedProduct.id
        ? {
          ...p,
          name: editName,
          price: Number(editPrice),
          order_id: Number(editOrderId) || 0,
          type: editType,
        }
        : p)));
      showOk('Producte actualitzat correctament!');
      handleCloseEditDialog();
    } catch {
      showError('Error actualitzant el producte.');
    }
  };

  const handleCloseAddProductDialog = () => {
    setAddProductOpen(false);
  };

  const handleSaveNewProduct = async () => {
    if (!newProductName || newProductPrice === '' || !newProductImageUrl) {
      showError('Omple tots els camps.');
      return;
    }
    try {
      const newProduct = {
        order_id: Number(newProductOrderId) || 0,
        name: newProductName,
        price: Number(newProductPrice),
        imageUrl: newProductImageUrl,
        type: newProductType,
      };
      const productRef = await addDoc(collection(db, 'ticket_products'), newProduct);
      localStorage.removeItem('all_products');
      setProducts([...products, { id: productRef.id, ...newProduct }]);
      showOk('Producte afegit correctament!');
      handleCloseAddProductDialog();
    } catch (error) {
      console.error('Error guardant el producte: ', error);
      showError('Error guardant el producte. Torna-ho a intentar.');
    }
  };

  const handleOpenAddProductDialog = () => {
    setNewProductName('');
    setNewProductPrice('');
    setNewProductImageUrl('');
    setNewProductOrderId(0);
    setNewProductType(ProductTypes.BARRA);
    setAddProductOpen(true);
  };

  const sortedProducts = [...products].sort((a, b) => a.order_id - b.order_id);
  const barraProducts = sortedProducts.filter((p) => p.type === ProductTypes.BARRA);
  const merchandisingProducts = sortedProducts.filter((p) => p.type === ProductTypes.MERCHANDISING);

  const renderProductGrid = (productList: Product[]) => (
    <Grid w="100%">
      {productList.map((product) => (
        <Grid.Col span={{ base: 6, sm: 6, md: 3 }} key={product.id}>
          <Paper
            withBorder
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1',
              overflow: 'hidden',
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
            <Group
              justify="center"
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
              }}
            >
              <ActionIcon
                size={56}
                radius="xl"
                color="blue"
                variant="filled"
                onClick={() => handleEditClick(product)}
                aria-label="Edita producte"
                style={{ pointerEvents: 'auto', opacity: 0.9 }}
              >
                <IconEdit size={28} />
              </ActionIcon>
            </Group>
          </Paper>
        </Grid.Col>
      ))}
    </Grid>
  );

  return (
    <Stack align="center" mt="md" gap="md" w="100%">
      {currentUser?.email === 'adminfma@gmail.com' && (
        <Group w="100%">
          <Button color="blue" onClick={handleOpenAddProductDialog}>Afegir Producte</Button>
        </Group>
      )}
      <Title order={2}>Editar Productes</Title>

      <Title order={3} mt="xs">{ProductTypesNames[ProductTypes.BARRA]}</Title>
      {renderProductGrid(barraProducts)}

      <Title order={3} mt="md">{ProductTypesNames[ProductTypes.MERCHANDISING]}</Title>
      {renderProductGrid(merchandisingProducts)}

      <Modal opened={editDialogOpen} onClose={handleCloseEditDialog} title="Edita el Producte" size="md" centered>
        <Stack>
          <TextInput
            label="Nom del Producte"
            value={editName}
            onChange={(e) => setEditName(e.currentTarget.value)}
          />
          <NumberInput
            label="Preu del Producte"
            value={editPrice}
            onChange={(val) => setEditPrice(val ?? '')}
            decimalScale={2}
            hideControls
          />
          <Select
            label="Tipus de producte"
            data={typeSelectData}
            value={String(editType)}
            onChange={(val) => setEditType(Number(val) as ProductTypes)}
          />
          <NumberInput
            label="Id ordre del producte"
            value={editOrderId}
            onChange={(val) => setEditOrderId(val ?? 0)}
            hideControls
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleCloseEditDialog}>Cancel·lar</Button>
            <Button color="blue" onClick={handleSaveEdit}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={addProductOpen} onClose={handleCloseAddProductDialog} title="Afegir Nou Producte" size="md" centered>
        <Stack>
          <TextInput
            label="Nom del Producte"
            value={newProductName}
            onChange={(e) => setNewProductName(e.currentTarget.value)}
          />
          <NumberInput
            label="Preu del Producte"
            value={newProductPrice}
            onChange={(val) => setNewProductPrice(val ?? '')}
            decimalScale={2}
            hideControls
          />
          <TextInput
            label="URL de la Imatge"
            value={newProductImageUrl}
            onChange={(e) => setNewProductImageUrl(e.currentTarget.value)}
          />
          <Select
            label="Tipus de producte"
            data={typeSelectData}
            value={String(newProductType)}
            onChange={(val) => setNewProductType(Number(val) as ProductTypes)}
          />
          <NumberInput
            label="Id ordre del producte"
            value={newProductOrderId}
            onChange={(val) => setNewProductOrderId(val ?? 0)}
            hideControls
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleCloseAddProductDialog}>Cancel·lar</Button>
            <Button color="blue" onClick={handleSaveNewProduct}>Guardar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default EditProduct;
