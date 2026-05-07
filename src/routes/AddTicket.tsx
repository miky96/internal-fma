import React, { useState, useEffect } from 'react';
import {
  collection, getDocs, addDoc, serverTimestamp,
} from 'firebase/firestore';
import {
  Stack, Title, Group, Grid, Paper, Button, NumberInput, ActionIcon, Box, Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconMinus, IconPlus } from '@tabler/icons-react';
import { db } from '../firebase/firestore';
import {
  Product, ProductTypes, ProductTypesNames, TicketItem,
} from '../model/ticket';

const AddTicket: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [ticketItems, setTicketItems] = useState<TicketItem[]>([]);
  const [moneyReceived, setMoneyReceived] = useState<number | string>('');

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
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
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

  const calculateTotal = () => ticketItems
    .reduce((sum, item) => sum + item.price * item.quantity, 0)
    .toFixed(2);

  const calculateChange = () => {
    const total = parseFloat(calculateTotal());
    const money = typeof moneyReceived === 'number' ? moneyReceived : parseFloat(String(moneyReceived));
    if (Number.isNaN(money)) return '0.00';
    return (money - total).toFixed(2);
  };

  const handleSaveTicket = async () => {
    if (ticketItems.length === 0) {
      notifications.show({ color: 'red', message: 'Encara no hi ha cap producte al ticket.' });
      return;
    }

    const filteredItems = ticketItems.filter((item) => item.name !== 'Got');
    const total = filteredItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
      await addDoc(collection(db, 'tickets'), {
        products: filteredItems,
        total,
        createdAt: serverTimestamp(),
      });
      setTicketItems([]);
      setMoneyReceived('');
      notifications.show({ color: 'green', message: 'Ticket guardat correctament!' });
    } catch (error) {
      console.error('Error guardant ticket: ', error);
      notifications.show({ color: 'red', message: 'Error guardant ticket. Torna-ho a intentar.' });
      setMoneyReceived('');
    }
  };

  const sortedProducts = [...products].sort((a, b) => a.order_id - b.order_id);
  const barraProducts = sortedProducts.filter((p) => p.type === ProductTypes.BARRA);
  const merchandisingProducts = sortedProducts.filter((p) => p.type === ProductTypes.MERCHANDISING);

  const renderProductCard = (product: Product) => (
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
          gap="md"
          justify="center"
          style={{
            position: 'absolute',
            bottom: 12,
            left: 0,
            right: 0,
          }}
        >
          <ActionIcon
            size={56}
            radius="xl"
            color="grape"
            variant="filled"
            onClick={() => removeItem(product)}
            aria-label="Treure unitat"
            style={{ opacity: 0.9 }}
          >
            <IconMinus size={32} />
          </ActionIcon>
          <ActionIcon
            size={56}
            radius="xl"
            color="blue"
            variant="filled"
            onClick={() => addItem(product)}
            aria-label="Afegir unitat"
            style={{ opacity: 0.9 }}
          >
            <IconPlus size={32} />
          </ActionIcon>
        </Group>
      </Paper>
    </Grid.Col>
  );

  return (
    <Stack align="center" mt="md" gap="md" w="100%">
      <Title order={2}>Afegir Tickets</Title>

      <Paper withBorder p="md" maw={600} w="100%">
        <Grid align="center">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Title order={4}>
              Total:
              {' '}
              {calculateTotal()}
              {' '}
              €
            </Title>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <NumberInput
              label="Diners Rebuts"
              value={moneyReceived}
              onChange={(val) => setMoneyReceived(val)}
              decimalScale={2}
              thousandSeparator=","
              hideControls
              inputMode="decimal"
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Title order={4}>
              Canvi:
              {' '}
              {calculateChange()}
              {' '}
              €
            </Title>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Button color="blue" fullWidth onClick={handleSaveTicket}>
              Guardar Ticket
            </Button>
          </Grid.Col>
        </Grid>
      </Paper>

      <Box w="100%" maw={600}>
        <Title order={3} mb="xs">Productes</Title>
        <Paper withBorder>
          <Stack gap={0}>
            {ticketItems.map((item) => (
              <Group key={item.id} justify="space-between" px="md" py="sm">
                <Group gap="sm">
                  <Title order={5}>{item.name}</Title>
                  <Text size="lg">
                    (
                    {item.quantity}
                    )
                  </Text>
                </Group>
                <Group gap="md">
                  <Text size="lg">
                    {(item.price * item.quantity).toFixed(2)}
                    {' '}
                    €
                  </Text>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    onClick={() => removeTicketItem(item.id)}
                    aria-label="Esborrar producte"
                  >
                    <IconTrash size={20} />
                  </ActionIcon>
                </Group>
              </Group>
            ))}
          </Stack>
        </Paper>
      </Box>

      <Title order={3} mt="md">{ProductTypesNames[ProductTypes.BARRA]}</Title>
      <Box w="100%" maw={600}>
        <Grid>{barraProducts.map(renderProductCard)}</Grid>
      </Box>

      <Title order={3} mt="md">{ProductTypesNames[ProductTypes.MERCHANDISING]}</Title>
      <Box w="100%" maw={600}>
        <Grid>{merchandisingProducts.map(renderProductCard)}</Grid>
      </Box>
    </Stack>
  );
};

export default AddTicket;
