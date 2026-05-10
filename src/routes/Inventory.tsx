import React, { useEffect, useMemo, useState } from 'react';
import {
  collection, getDocs, addDoc, updateDoc, doc, query, orderBy, serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  Stack, Title, Group, Button, Modal, TextInput, Tabs, Grid, Box, Text, Badge, Paper,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconBox, IconCalendarStats, IconFolderPlus,
} from '@tabler/icons-react';
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

// Esborra documents en lots de 400 per evitar el limit de 500 ops/batch a Firestore.
const deleteEntriesInChunks = async (ids: string[]) => {
  const CHUNK = 400;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const slice = ids.slice(i, i + CHUNK);
    const batch = writeBatch(db);
    slice.forEach((id) => batch.delete(doc(db, 'inventoryEntries', id)));
    await batch.commit();
  }
};

const Inventory: React.FC = () => {
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Quin popover esta obert (nomes un alhora). Si null, cap.
  const [openProductName, setOpenProductName] = useState<string | null>(null);

  // Modal Nou producte
  const [newProductDialogOpen, setNewProductDialogOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');

  // Modal Nova categoria
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryFirstProduct, setNewCategoryFirstProduct] = useState('');

  // Modal Edita nom de producte
  const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingProductName, setEditingProductName] = useState('');

  useEffect(() => {
    const fetchEntries = async () => {
      const q = query(collection(db, 'inventoryEntries'), orderBy('date'));
      const snap = await getDocs(q);
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as InventoryEntry[];
      const currentYear = new Date().getFullYear();
      const isCurrentYear = (e: InventoryEntry) => (
        new Date(e.date.seconds * 1000).getFullYear() === currentYear
      );
      const current = all.filter(isCurrentYear);
      const old = all.filter((e) => !isCurrentYear(e));
      setEntries(current);
      // Neteja en background de les entries d'altres anys.
      if (old.length > 0) {
        try {
          await deleteEntriesInChunks(old.map((e) => e.id));
        } catch (err) {
          console.error('Error esborrant entries d\'anys anteriors:', err);
        }
      }
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

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set).sort();
  }, [products]);

  const productsByCategory = useMemo(() => {
    const out: { [category: string]: Product[] } = {};
    categories.forEach((cat) => {
      out[cat] = products
        .filter((p) => p.category === cat)
        .sort((a, b) => a.name.localeCompare(b.name));
    });
    return out;
  }, [products, categories]);

  const productNamesByCategory = useMemo(() => {
    const out: { [category: string]: string[] } = {};
    Object.entries(productsByCategory).forEach(([cat, list]) => {
      out[cat] = list.map((p) => p.name);
    });
    return out;
  }, [productsByCategory]);

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

  useEffect(() => {
    if (!activeTab && categories.length > 0) setActiveTab(categories[0]);
  }, [activeTab, categories]);

  useEffect(() => {
    setOpenProductName(null);
  }, [activeTab]);

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
    if (!activeTab) {
      setNewCategoryDialogOpen(true);
      setNewCategoryName('');
      setNewCategoryFirstProduct('');
      return;
    }
    setNewProductDialogOpen(true);
    setNewProductName('');
    setNewProductCategory(activeTab);
  };
  const handleCloseNewProductDialog = () => {
    setNewProductDialogOpen(false);
    setNewProductName('');
    setNewProductCategory('');
  };

  const handleAddNewProduct = async () => {
    if (!newProductName.trim() || !newProductCategory) {
      showError('Omple el nom del producte');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        name: newProductName.trim(),
        category: newProductCategory,
      });
      setProducts((prev) => [...prev, {
        id: docRef.id, name: newProductName.trim(), category: newProductCategory,
      }]);
      setActiveTab(newProductCategory);
      showOk('Producte afegit correctament!');
      handleCloseNewProductDialog();
    } catch {
      showError('Error afegint producte nou');
    }
  };

  const handleOpenNewCategoryDialog = () => {
    setNewCategoryDialogOpen(true);
    setNewCategoryName('');
    setNewCategoryFirstProduct('');
  };
  const handleCloseNewCategoryDialog = () => {
    setNewCategoryDialogOpen(false);
    setNewCategoryName('');
    setNewCategoryFirstProduct('');
  };

  const handleAddNewCategory = async () => {
    const cat = newCategoryName.trim();
    const prod = newCategoryFirstProduct.trim();
    if (!cat || !prod) {
      showError('Omple el nom de la categoria i del primer producte');
      return;
    }
    if (categories.includes(cat)) {
      showError('Aquesta categoria ja existeix');
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        name: prod,
        category: cat,
      });
      setProducts((prev) => [...prev, { id: docRef.id, name: prod, category: cat }]);
      setActiveTab(cat);
      showOk('Categoria creada!');
      handleCloseNewCategoryDialog();
    } catch (err) {
      console.error('Error creant categoria:', err);
      showError('Error creant la categoria');
    }
  };

  const handleOpenEditNameDialog = (product: Product) => {
    setEditingProduct(product);
    setEditingProductName(product.name);
    setEditNameDialogOpen(true);
  };
  const handleCloseEditNameDialog = () => {
    setEditNameDialogOpen(false);
    setEditingProduct(null);
    setEditingProductName('');
  };

  const handleSaveEditName = async () => {
    if (!editingProduct) return;
    const oldName = editingProduct.name;
    const newName = editingProductName.trim();
    if (!newName) {
      showError('El nom no pot estar buit');
      return;
    }
    if (newName === oldName) {
      handleCloseEditNameDialog();
      return;
    }
    if (products.some((p) => p.id !== editingProduct.id && p.name === newName)) {
      showError('Ja existeix un producte amb aquest nom');
      return;
    }
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'products', editingProduct.id), { name: newName });
      entries.filter((e) => e.name === oldName).forEach((e) => {
        batch.update(doc(db, 'inventoryEntries', e.id), { name: newName });
      });
      await batch.commit();
      setProducts((prev) => prev.map((p) => (
        p.id === editingProduct.id ? { ...p, name: newName } : p
      )));
      setEntries((prev) => prev.map((e) => (e.name === oldName ? { ...e, name: newName } : e)));
      showOk('Producte renombrat');
      handleCloseEditNameDialog();
    } catch (err) {
      console.error('Error renombrant producte:', err);
      showError('Error renombrant el producte');
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
        <Group gap="xs">
          <Button
            variant="light"
            color="indigo"
            leftSection={<IconFolderPlus size={16} />}
            onClick={handleOpenNewCategoryDialog}
          >
            Nova categoria
          </Button>
          <Button
            color="indigo"
            leftSection={<IconPlus size={16} />}
            onClick={handleOpenNewProductDialog}
            disabled={categories.length === 0}
          >
            Nou producte
          </Button>
        </Group>
      </Group>

      {categories.length === 0 ? (
        <Paper withBorder p="xl" radius="md">
          <Stack align="center" gap="xs">
            <IconBox size={36} style={{ opacity: 0.4 }} />
            <Text c="dimmed">Encara no hi ha categories. Comenca creant-ne una.</Text>
            <Button
              variant="light"
              color="indigo"
              leftSection={<IconFolderPlus size={16} />}
              onClick={handleOpenNewCategoryDialog}
            >
              Nova categoria
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
                        opened={openProductName === p.name}
                        onOpenChange={(o) => setOpenProductName(o ? p.name : null)}
                        onSave={(qty) => handleSaveQuantity(p.name, qty)}
                        onEditName={() => handleOpenEditNameDialog(p)}
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

      {/* Modal Nou producte: categoria fixa = pestanya activa */}
      <Modal
        opened={newProductDialogOpen}
        onClose={handleCloseNewProductDialog}
        title="Nou producte"
      >
        <Stack>
          <TextInput
            label="Categoria"
            value={newProductCategory}
            disabled
            description="La categoria es la de la pestanya activa i no es pot canviar des d'aqui."
          />
          <TextInput
            label="Nom"
            value={newProductName}
            onChange={(e) => setNewProductName(e.currentTarget.value)}
            data-autofocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddNewProduct(); }}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleCloseNewProductDialog}>Cancel·lar</Button>
            <Button color="indigo" onClick={handleAddNewProduct}>Afegeix</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal Nova categoria: nom + primer producte */}
      <Modal
        opened={newCategoryDialogOpen}
        onClose={handleCloseNewCategoryDialog}
        title="Nova categoria"
      >
        <Stack>
          <TextInput
            label="Nom de la categoria"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.currentTarget.value)}
            placeholder="ex. Begudes, Menjar, Merchan, ..."
            data-autofocus
          />
          <TextInput
            label="Primer producte de la categoria"
            value={newCategoryFirstProduct}
            onChange={(e) => setNewCategoryFirstProduct(e.currentTarget.value)}
            placeholder="ex. Cocacola, Samarreta, ..."
            description="Una categoria nomes existeix si te com a minim un producte."
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddNewCategory(); }}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleCloseNewCategoryDialog}>Cancel·lar</Button>
            <Button color="indigo" onClick={handleAddNewCategory}>Crea</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal Edita nom de producte */}
      <Modal
        opened={editNameDialogOpen}
        onClose={handleCloseEditNameDialog}
        title="Edita nom del producte"
      >
        <Stack>
          <TextInput
            label="Nou nom"
            value={editingProductName}
            onChange={(e) => setEditingProductName(e.currentTarget.value)}
            data-autofocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditName(); }}
          />
          <Text size="xs" c="dimmed">
            També s&apos;actualitzaran les entrades de l&apos;historic amb el nom antic.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleCloseEditNameDialog}>Cancel·lar</Button>
            <Button color="indigo" onClick={handleSaveEditName}>Guarda</Button>
          </Group>
        </Stack>
      </Modal>

      <Box style={{ height: 24 }} />
    </Stack>
  );
};

export default Inventory;
