import React, { useEffect, useMemo, useState } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, doc, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import {
  Stack, Title, Group, Button, Modal, TextInput, Tabs, Grid, Box, Text, Badge, Paper,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconBox, IconCalendarStats } from '@tabler/icons-react';
import { db } from '../firebase/firestore';
import ProductCard from '../components/inventory/ProductCard';
import HistorySection from '../components/inventory/HistorySection';
import { businessDayKey, todayBusinessDayKey } from '../components/inventory/businessDay';

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
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const [newProductDialogOpen, setNewProductDialogOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');

  useEffect(() => {
    const fetchEntries = async () => {
      const q = query(collection(db, 'inventoryEntries'), orderBy('date'));
      const snap = await getDocs(q);
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as InventoryEntry[]);
    };
    fetchEntries();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      const snap = await getDocs(query(collection(db, 'products')));
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Product[]);
    };
    fetchProducts();
  }, []);

  const todayKey = todayBusinessDayKey();

  // Mapa productName -> entry d'avui (id, quantitat, ultima actualitzacio).
  // Ho derivem de l'estat local; aixi un cop guardat ja es reflecteix sense
  // tornar a consultar Firestore.
  const todayByProduct = useMemo(() => {
    const map = new Map<string, { id: string; quantity: number; updatedAt: Date }>();
    entries.forEach((e) => {
      const d = new Date(e.date.seconds * 1000);
      if (businessDayKey(d) === todayKey) {
        map.set(e.name, { id: e.id, quantity: e.quantity, updatedAt: d });
      }
    });
    return map;
  }, [entries, todayKey]);

  // Categories ordenades alfabeticament per estabilitat de les pestanyes.
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set).sort();
  }, [products]);

  // Productes per categoria, ordenats per nom.
  const productsByCategory = useMemo(() => {
    const out: { [category: string]: Product[] } = {};
    categories.forEach((cat) => {
      out[cat] = products
        .filter((p) => p.category === cat)
        .sort((a, b) => a.name.localeCompare(b.name));
    });
    return out;
  }, [products, categories]);

  // Per al component d'historic: nomes ens cal el llistat de noms per categoria.
  const productNamesByCategory = useMemo(() => {
    const out: { [category: string]: string[] } = {};
    Object.entries(productsByCategory).forEach(([cat, list]) => {
      out[cat] = list.map((p) => p.name);
    });
    return out;
  }, [productsByCategory]);

  // Estructura plana per al render historic (data -> producte -> quantitat).
  const groupedEntries = useMemo(() => {
    const out: { [date: string]: { [productName: string]: number } } = {};
    entries.forEach((e) => {
      const d = new Date(e.date.seconds * 1000);
      const key = businessDayKey(d);
      if (!out[key]) out[key] = {};
      out[key][e.name] = e.quantity;
    });
    return out;
  }, [entries]);

  // Si encara no hi ha pestanya activa pero ja tenim categories, en defaultem una.
  useEffect(() => {
    if (!activeTab && categories.length > 0) setActiveTab(categories[0]);
  }, [activeTab, categories]);

  // Comptador d'actualitzacions d'avui per categoria (per al badge a la pestanya).
  const todayCountByCategory = useMemo(() => {
    const out: { [cat: string]: { done: number; total: number } } = {};
    categories.forEach((cat) => {
      const list = productsByCategory[cat] ?? [];
      const done = list.filter((p) => todayByProduct.has(p.name)).length;
      out[cat] = { done, total: list.length };
    });
    return out;
  }, [categories, productsByCategory, todayByProduct]);

  const handleSaveQuantity = async (productName: string, qty: number) => {
    const existing = todayByProduct.get(productName);
    try {
      if (existing) {
        const ref = doc(db, 'inventoryEntries', existing.id);
        await updateDoc(ref, { quantity: qty, date: serverTimestamp() });
        setEntries((prev) => prev.map((e) => (e.id === existing.id
          ? { ...e, quantity: qty, date: { seconds: Date.now() / 1000, nanoseconds: 0 } }
          : e)));
      } else {
        const ref = await addDoc(collection(db, 'inventoryEntries'), {
          name: productName,
          quantity: qty,
          date: serverTimestamp(),
        });
        setEntries((prev) => [...prev, {
          id: ref.id,
          name: productName,
          quantity: qty,
          date: { seconds: Date.now() / 1000, nanoseconds: 0 },
        }]);
      }
      showOk(`${productName}: ${qty}`);
    } catch (err) {
      console.error('Error guardant entrada inventari:', err);
      showError('Error guardant la quantitat');
      throw err;
    }
  };

  const handleOpenNewProductDialog = () => {
    setNewProductDialogOpen(true);
    setNewProductName('');
    setNewProductCategory(activeTab ?? '');
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
      setProducts((prev) => [...prev, {
        id: docRef.id, name: newProductName, category: newProductCategory,
      }]);
      setActiveTab(newProductCategory);
      showOk('Producte afegit correctament!');
      handleCloseNewProductDialog();
    } catch {
      showError('Error afegint producte nou');
    }
  };

  const formattedToday = new Date().toLocaleDateString('ca-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <Stack mt="md" gap="md" w="100%">
      <Group justify="space-between" wrap="wrap" gap="xs">
        <Stack gap={2}>
          <Title order={2}>Inventari</Title>
          <Group gap={6} c="dimmed">
            <IconCalendarStats size={14} />
            <Text size="sm" tt="capitalize">{formattedToday}</Text>
          </Group>
        </Stack>
        <Button
          color="indigo"
          leftSection={<IconPlus size={16} />}
          onClick={handleOpenNewProductDialog}
        >
          Nou producte
        </Button>
      </Group>

      {categories.length === 0 ? (
        <Paper withBorder p="xl" radius="md">
          <Stack align="center" gap="xs">
            <IconBox size={36} style={{ opacity: 0.4 }} />
            <Text c="dimmed">Encara no hi ha productes. Comenca creant-ne un.</Text>
            <Button
              variant="light"
              color="indigo"
              leftSection={<IconPlus size={16} />}
              onClick={handleOpenNewProductDialog}
            >
              Nou producte
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          variant="pills"
          radius="md"
          keepMounted={false}
        >
          <Tabs.List style={{ overflowX: 'auto', flexWrap: 'nowrap' }}>
            {categories.map((cat) => {
              const c = todayCountByCategory[cat];
              return (
                <Tabs.Tab
                  key={cat}
                  value={cat}
                  rightSection={(
                    <Badge
                      size="xs"
                      variant={c.done === c.total && c.total > 0 ? 'filled' : 'light'}
                      color={c.done === c.total && c.total > 0 ? 'teal' : 'gray'}
                    >
                      {c.done}
                      /
                      {c.total}
                    </Badge>
                  )}
                >
                  {cat}
                </Tabs.Tab>
              );
            })}
          </Tabs.List>

          {categories.map((cat) => (
            <Tabs.Panel key={cat} value={cat} pt="md">
              <Grid>
                {productsByCategory[cat].map((p) => {
                  const todayInfo = todayByProduct.get(p.name);
                  return (
                    <Grid.Col key={p.id} span={{ base: 6, sm: 4, md: 3 }}>
                      <ProductCard
                        productName={p.name}
                        todayQuantity={todayInfo ? todayInfo.quantity : null}
                        lastUpdatedAt={todayInfo ? todayInfo.updatedAt : null}
                        onSave={(qty) => handleSaveQuantity(p.name, qty)}
                      />
                    </Grid.Col>
                  );
                })}
              </Grid>
              {productsByCategory[cat].length === 0 && (
                <Text c="dimmed" size="sm" ta="center" py="md">
                  No hi ha productes en aquesta categoria.
                </Text>
              )}
            </Tabs.Panel>
          ))}
        </Tabs>
      )}

      <HistorySection
        groupedEntries={groupedEntries}
        productNamesByCategory={productNamesByCategory}
        todayKey={todayKey}
      />

      <Modal
        opened={newProductDialogOpen}
        onClose={handleCloseNewProductDialog}
        title="Nou producte"
      >
        <Stack>
          <TextInput
            label="Nom"
            value={newProductName}
            onChange={(e) => setNewProductName(e.currentTarget.value)}
            data-autofocus
          />
          <TextInput
            label="Categoria"
            value={newProductCategory}
            onChange={(e) => setNewProductCategory(e.currentTarget.value)}
            placeholder="ex. Begudes, Menjar, ..."
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleCloseNewProductDialog}>Cancel·lar</Button>
            <Button color="indigo" onClick={handleAddNewProduct}>Afegeix</Button>
          </Group>
        </Stack>
      </Modal>

      <Box style={{ height: 24 }} />
    </Stack>
  );
};

export default Inventory;
