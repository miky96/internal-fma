import React, { useState, useEffect, useMemo } from 'react';
import {
  collection, getDocs, addDoc, serverTimestamp,
} from 'firebase/firestore';
import {
  Stack, Title, Group, Grid, Paper, Button, NumberInput, ActionIcon, Box, Text,
  Tabs, Badge, Indicator, Divider, Container, Affix,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconTrash, IconMinus, IconPlus, IconBeer, IconShirt, IconReceipt2, IconCheck,
} from '@tabler/icons-react';
import { db } from '../firebase/firestore';
import {
  Product, ProductTypes, ProductTypesNames, TicketItem,
} from '../model/ticket';
import { businessDateKey, businessYear } from '../model/businessDate';

const QUICK_AMOUNTS = [5, 10, 20, 50];

const AddTicket: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([]);
  const [moneyReceived, setMoneyReceived] = useState<number | string>('');
  const [activeTab, setActiveTab] = useState<string>(String(ProductTypes.BARRA));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const cachedProducts = localStorage.getItem('all_products');
      if (cachedProducts) {
        setProducts(JSON.parse(cachedProducts));
      } else {
        const querySnapshot = await getDocs(collection(db, 'ticket_products'));
        const productsData = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Product[];
        setProducts(productsData);
        localStorage.setItem('all_products', JSON.stringify(productsData));
      }
    };
    fetchProducts();
  }, []);

  const addItem = (product: Product) => {
    setTicketItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => (item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item));
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeItem = (product: Product) => {
    setTicketItems((prev) => prev
      .map((item) => (item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item))
      .filter((item) => item.quantity > 0));
  };

  const removeTicketItem = (itemId: string) => {
    setTicketItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const totalNum = useMemo(
    () => ticketItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [ticketItems],
  );
  const total = totalNum.toFixed(2);

  const change = useMemo(() => {
    const money = typeof moneyReceived === 'number' ? moneyReceived : parseFloat(String(moneyReceived));
    if (Number.isNaN(money)) return '0.00';
    return (money - totalNum).toFixed(2);
  }, [moneyReceived, totalNum]);

  const handleSaveTicket = async () => {
    if (ticketItems.length === 0) {
      notifications.show({ color: 'red', message: 'Encara no hi ha cap producte al ticket.' });
      return;
    }

    const filteredItems = ticketItems.filter((item) => item.name !== 'Got');
    const totalToSave = filteredItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    setSaving(true);
    try {
      // Calculem businessDate/year amb el rellotge del client.
      // serverTimestamp() és més precís però no és accessible abans del write,
      // i la diferència entre rellotge local i servidor és de pocs segons —
      // negligible per al tall de les 5h. Si en algun moment volem 100%
      // server-time, es pot moure a una Cloud Function que ompli el camp.
      const now = new Date();
      await addDoc(collection(db, 'tickets'), {
        products: filteredItems,
        total: totalToSave,
        createdAt: serverTimestamp(),
        businessDate: businessDateKey(now),
        year: businessYear(now),
      });
      setTicketItems([]);
      setMoneyReceived('');
      notifications.show({ color: 'green', message: 'Ticket guardat correctament!' });
    } catch (error) {
      console.error('Error guardant ticket: ', error);
      notifications.show({ color: 'red', message: 'Error guardant ticket. Torna-ho a intentar.' });
      setMoneyReceived('');
    } finally {
      setSaving(false);
    }
  };

  const itemQuantity = (productId: string) => ticketItems
    .find((it) => it.id === productId)?.quantity ?? 0;

  const sortedProducts = [...products].sort((a, b) => a.order_id - b.order_id);
  const barraProducts = sortedProducts.filter((p) => p.type === ProductTypes.BARRA);
  const merchandisingProducts = sortedProducts.filter((p) => p.type === ProductTypes.MERCHANDISING);

  const renderProductCard = (product: Product) => {
    const qty = itemQuantity(product.id);
    return (
      <Grid.Col span={{ base: 6, sm: 6, md: 3 }} key={product.id}>
        <Indicator
          inline
          processing={false}
          disabled={qty === 0}
          label={qty}
          size={28}
          color="indigo"
          offset={6}
          position="top-end"
          styles={{ indicator: { fontWeight: 700, fontSize: 14 } }}
        >
          <Paper
            withBorder
            shadow="sm"
            radius="md"
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1',
              overflow: 'hidden',
              transition: 'transform 120ms ease, box-shadow 120ms ease',
              transform: qty > 0 ? 'scale(1.01)' : 'none',
              outline: qty > 0 ? '2px solid var(--mantine-color-indigo-5)' : 'none',
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
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                padding: '8px 10px',
                background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: 13,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{product.name}</span>
              <span>
                {product.price.toFixed(2)}
                {' €'}
              </span>
            </Box>
            <Group
              gap="md"
              justify="center"
              style={{
                position: 'absolute',
                bottom: 36,
                left: 0,
                right: 0,
              }}
            >
              <ActionIcon
                size={52}
                radius="xl"
                color="grape"
                variant="filled"
                onClick={() => removeItem(product)}
                aria-label="Treure unitat"
                style={{ opacity: 0.92 }}
                disabled={qty === 0}
              >
                <IconMinus size={28} />
              </ActionIcon>
              <ActionIcon
                size={52}
                radius="xl"
                color="indigo"
                variant="filled"
                onClick={() => addItem(product)}
                aria-label="Afegir unitat"
                style={{ opacity: 0.92 }}
              >
                <IconPlus size={28} />
              </ActionIcon>
            </Group>
          </Paper>
        </Indicator>
      </Grid.Col>
    );
  };

  const itemsCount = ticketItems.reduce((s, it) => s + it.quantity, 0);
  const hasItems = itemsCount > 0;

  return (
    <Stack align="center" mt="md" gap="md" w="100%" pb={hasItems ? 220 : 24}>
      <Group justify="space-between" w="100%" maw={720} px="xs">
        <Title order={2}>Afegir Tickets</Title>
        {hasItems && (
          <Badge size="lg" color="indigo" variant="light" leftSection={<IconReceipt2 size={14} />}>
            {itemsCount}
            {' '}
            unitats
          </Badge>
        )}
      </Group>

      {hasItems && (
        <Box w="100%" maw={720}>
          <Paper withBorder p="sm" radius="md">
            <Stack gap={4}>
              {ticketItems.map((item) => (
                <Group key={item.id} justify="space-between" px="xs" py={4} wrap="nowrap">
                  <Group gap="xs" wrap="nowrap">
                    <Badge variant="light" color="indigo" size="lg">
                      x
                      {item.quantity}
                    </Badge>
                    <Text fw={600} truncate>{item.name}</Text>
                  </Group>
                  <Group gap="xs" wrap="nowrap">
                    <Text fw={600}>
                      {(item.price * item.quantity).toFixed(2)}
                      {' €'}
                    </Text>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => removeTicketItem(item.id)}
                      aria-label="Esborrar producte"
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Group>
              ))}
            </Stack>
          </Paper>
        </Box>
      )}

      <Box w="100%" maw={720}>
        <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? String(ProductTypes.BARRA))} variant="pills" radius="md">
          <Tabs.List grow>
            <Tabs.Tab value={String(ProductTypes.BARRA)} leftSection={<IconBeer size={16} />}>
              {ProductTypesNames[ProductTypes.BARRA]}
            </Tabs.Tab>
            <Tabs.Tab value={String(ProductTypes.MERCHANDISING)} leftSection={<IconShirt size={16} />}>
              {ProductTypesNames[ProductTypes.MERCHANDISING]}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value={String(ProductTypes.BARRA)} pt="md">
            <Grid>{barraProducts.map(renderProductCard)}</Grid>
          </Tabs.Panel>
          <Tabs.Panel value={String(ProductTypes.MERCHANDISING)} pt="md">
            <Grid>{merchandisingProducts.map(renderProductCard)}</Grid>
          </Tabs.Panel>
        </Tabs>
      </Box>

      {hasItems && (
        <Affix position={{ bottom: 0, left: 0, right: 0 }} zIndex={200}>
          <Paper
            withBorder
            radius={0}
            shadow="lg"
            style={{
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: 'none',
              backdropFilter: 'blur(6px)',
              background: 'rgba(255,255,255,0.96)',
            }}
          >
            <Container size="lg" py="sm">
              <Stack gap={8}>
                <Group justify="space-between" wrap="nowrap">
                  <Group gap={6} wrap="nowrap">
                    {QUICK_AMOUNTS.map((amount) => (
                      <Button
                        key={amount}
                        size="xs"
                        radius="xl"
                        variant="light"
                        color="indigo"
                        onClick={() => setMoneyReceived(amount)}
                      >
                        {amount}
                        {' €'}
                      </Button>
                    ))}
                    <Button
                      size="xs"
                      radius="xl"
                      variant="light"
                      color="teal"
                      leftSection={<IconCheck size={14} />}
                      onClick={() => setMoneyReceived(Number(total))}
                    >
                      Exacte
                    </Button>
                  </Group>
                </Group>

                <Group align="flex-end" justify="space-between" wrap="nowrap" gap="sm">
                  <Stack gap={0}>
                    <Text size="xs" c="dimmed">Total</Text>
                    <Title order={3} c="indigo.7" lh={1}>
                      {total}
                      {' €'}
                    </Title>
                  </Stack>
                  <NumberInput
                    label="Diners rebuts"
                    value={moneyReceived}
                    onChange={(val) => setMoneyReceived(val)}
                    decimalScale={2}
                    thousandSeparator=","
                    hideControls
                    inputMode="decimal"
                    w={130}
                    size="sm"
                  />
                  <Stack gap={0} align="flex-end">
                    <Text size="xs" c="dimmed">Canvi</Text>
                    <Title order={4} lh={1} c={parseFloat(change) < 0 ? 'red.7' : 'teal.7'}>
                      {change}
                      {' €'}
                    </Title>
                  </Stack>
                </Group>

                <Divider my={2} />
                <Button
                  color="indigo"
                  fullWidth
                  size="md"
                  loading={saving}
                  leftSection={<IconReceipt2 size={18} />}
                  onClick={handleSaveTicket}
                >
                  Guardar Ticket
                </Button>
              </Stack>
            </Container>
          </Paper>
        </Affix>
      )}
    </Stack>
  );
};

export default AddTicket;
