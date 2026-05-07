import React, { useState, useEffect } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, doc, query, orderBy, where, serverTimestamp,
} from 'firebase/firestore';
import {
  Stack, Title, Group, Button, Table, Modal, TextInput, NumberInput, Select, Box,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { db } from '../firebase/firestore';

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

const showError = (message: string) => notifications.show({ color: 'red', message });
const showOk = (message: string) => notifications.show({ color: 'green', message });

const Inventory: React.FC = () => {
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>('');
  const [quantity, setQuantity] = useState<number | string>('');
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

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const getProductsByCategory = (category: string) => products
    .filter((p) => p.category === category)
    .map((p) => p.name);

  const handleOpenDialog = () => {
    setSelectedProduct('');
    setQuantity('');
    setOpen(true);
  };
  const handleCloseDialog = () => setOpen(false);

  const handleSaveEntry = async () => {
    if (!selectedProduct || quantity === '') {
      showError('Omple tots els camps');
      return;
    }

    const now = new Date();
    const entryDate = new Date();
    entryDate.setHours(now.getHours() < 5 ? -1 : 0, 0, 0, 0);

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
        setEntries(entries.map((entry) => (entry.id === existingEntry.id
          ? { ...entry, quantity: Number(quantity), date: { seconds: Date.now() / 1000, nanoseconds: 0 } }
          : entry)));
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

      showOk('Producte inventari actualitzat correctament!');
      handleCloseDialog();
    } catch (error) {
      console.error('Error guardant entrada inventari: ', error);
      showError('Error guardant entrada inventari');
    }
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
      <Box mt="md" w="100%" key={category}>
        <Title order={4} mb="xs">{categoryName}</Title>
        <Table withTableBorder withColumnBorders striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              {productNames.map((name) => (
                <Table.Th key={name}>{name}</Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Object.keys(groupedEntries).map((date) => (
              <Table.Tr key={date}>
                <Table.Td>{date}</Table.Td>
                {productNames.map((name) => (
                  <Table.Td key={name}>{groupedEntries[date][name] || 0}</Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
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
      showError('Omple tots els camps del producte nou');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        name: newProductName,
        category: newProductCategory,
      });
      setProducts([...products, { id: docRef.id, name: newProductName, category: newProductCategory }]);
      showOk('Producte afegit correctament!');
      handleCloseNewProductDialog();
    } catch {
      showError('Error afegint producte nou');
    }
  };

  const productOptions = products.map((p) => ({ value: p.name, label: p.name }));

  return (
    <Stack align="center" mt="md" gap="md">
      <Title order={2}>Inventari</Title>
      <Group>
        <Button color="blue" onClick={handleOpenDialog}>Actualitza quantitat</Button>
        <Button variant="outline" color="grape" onClick={handleOpenNewProductDialog}>Nou producte</Button>
      </Group>

      {categories.map((cat) => renderTable(cat, cat))}

      <Modal opened={newProductDialogOpen} onClose={handleCloseNewProductDialog} title="Nou producte" centered>
        <Stack>
          <TextInput
            label="Nom"
            value={newProductName}
            onChange={(e) => setNewProductName(e.currentTarget.value)}
          />
          <TextInput
            label="Categoria"
            value={newProductCategory}
            onChange={(e) => setNewProductCategory(e.currentTarget.value)}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleCloseNewProductDialog}>Cancel·lar</Button>
            <Button color="blue" onClick={handleAddNewProduct}>Afegeix</Button>
          </Group>
        </Stack>
      </Modal>

      <Modal opened={open} onClose={handleCloseDialog} title="Afegeix o Actualitza" centered>
        <Stack>
          <Select
            placeholder="Selecciona un producte"
            data={productOptions}
            value={selectedProduct}
            onChange={(val) => setSelectedProduct(val)}
            searchable
          />
          <NumberInput
            label="Quantitat"
            value={quantity}
            onChange={(val) => setQuantity(val ?? '')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleCloseDialog}>Cancel·lar</Button>
            <Button color="blue" onClick={handleSaveEntry}>Guarda</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default Inventory;
