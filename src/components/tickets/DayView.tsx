import React, {
  useState, useEffect, useMemo, useContext,
} from 'react';
import {
  collection, query, where, getDocs, deleteDoc, doc,
} from 'firebase/firestore';
import {
  Stack, SimpleGrid, Paper, Group, Text, Title, Badge, ScrollArea, Table,
  Center, Loader, ActionIcon, TextInput, Modal, Button, Box,
} from '@mantine/core';
import {
  IconCash, IconReceipt2, IconTrash, IconSearch, IconPackage,
  IconArrowsSort, IconArrowUp, IconArrowDown,
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { notifications } from '@mantine/notifications';
import { db } from '../../firebase/firestore';
import { AuthContext } from '../../context/AuthContext';
import { Ticket } from '../../model/ticket';
import {
  PRODUCT_TO_REMOVE, sumTotal, topProducts,
} from '../../model/ticketAggregation';
import { todayBusinessDateKey } from '../../model/businessDate';
import KpiTile, { formatEur } from './KpiTile';

type SortKey = 'createdAt' | 'total';
type SortDir = 'asc' | 'desc';

const DayView: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<string>(todayBusinessDateKey());
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { currentUser } = useContext(AuthContext);
  const isAdmin = currentUser?.email === 'adminfma@gmail.com';
  const isEconomia = currentUser?.email === 'economiafma@gmail.com' || isAdmin;

  // Fetch del dia amb cleanup + timeout.
  //
  // Per què aquest patró i no un useCallback + fetch "lliure":
  // 1) Cleanup amb flag `cancelled`: si l'usuari canvia de dia o de tab abans
  //    que la query resolgui, ignorem el resultat tardà. Evita setStates sobre
  //    closures obsoletes i el clàssic bug de "veure dades del dia anterior".
  // 2) Timeout de 12s: la SDK de Firestore web multiplexa queries sobre un
  //    únic stream gRPC; després d'un delete + canvi de tab la query nova pot
  //    quedar penjada sense rebutjar mai. Sense aquest rescat, `loading` es
  //    quedava a true per sempre (el bug que ens portava aquí).
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'tickets'), where('businessDate', '==', selectedDay));
        const snap = await Promise.race([
          getDocs(q),
          new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('timeout')), 12000);
          }),
        ]);
        if (cancelled) return;
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Ticket[];
        setTickets(data);
      } catch (e) {
        if (cancelled) return;
        console.error('Error carregant tickets del dia:', e);
        notifications.show({
          id: 'day-fetch-error',
          color: 'red',
          message: 'Error carregant tickets del dia. Reintenta.',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [selectedDay]);

  const dayKpis = useMemo(() => {
    const total = sumTotal(tickets);
    const count = tickets.length;
    const avg = count > 0 ? total / count : 0;
    const top = topProducts(tickets, 3);
    return {
      total, count, avg, top,
    };
  }, [tickets]);

  const visibleTickets = useMemo(() => {
    const s = search.trim().toLowerCase();
    let list = tickets;
    if (s) list = list.filter((t) => t.products.some((p) => p.name.toLowerCase().includes(s)));
    list = [...list].sort((a, b) => {
      const cmp = sortKey === 'createdAt'
        ? a.createdAt.seconds - b.createdAt.seconds
        : a.total - b.total;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [tickets, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return <IconArrowsSort size={14} />;
    return sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />;
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    try {
      await deleteDoc(doc(db, 'tickets', confirmId));
      setTickets((prev) => prev.filter((t) => t.id !== confirmId));
      notifications.show({ color: 'green', message: 'Ticket borrat correctament!' });
    } catch (e) {
      console.error(e);
      notifications.show({ color: 'red', message: 'Error eliminant ticket.' });
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md">
        <Group align="flex-end" gap="sm" wrap="wrap">
          <Box>
            <Text size="xs" fw={500} mb={4}>Dia</Text>
            <input
              type="date"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              style={{
                height: 36,
                padding: '0 10px',
                borderRadius: 8,
                border: '1px solid var(--mantine-color-gray-4)',
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            />
          </Box>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setSelectedDay(todayBusinessDateKey())}
            disabled={selectedDay === todayBusinessDateKey()}
          >
            Avui
          </Button>
        </Group>
      </Paper>

      {loading ? (
        <Center h="40vh"><Loader /></Center>
      ) : (
        <>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            <KpiTile label="Total dia" value={formatEur(dayKpis.total)} icon={<IconCash size={20} />} color="teal" />
            <KpiTile label="Tickets" value={String(dayKpis.count)} icon={<IconReceipt2 size={20} />} color="blue" />
            <KpiTile label="Ticket mig" value={formatEur(dayKpis.avg)} icon={<IconCash size={20} />} color="orange" />
            <Paper withBorder p="md" radius="md" shadow="xs">
              <Group gap={6} mb={4}>
                <IconPackage size={16} color="var(--mantine-color-grape-7)" />
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Top productes</Text>
              </Group>
              {dayKpis.top.length === 0 ? (
                <Text size="sm" c="dimmed">—</Text>
              ) : (
                <Stack gap={2}>
                  {dayKpis.top.map((p, idx) => (
                    <Group key={p.name} justify="space-between" wrap="nowrap">
                      <Text size="sm" truncate>
                        {idx + 1}
                        .
                        {' '}
                        {p.name}
                      </Text>
                      <Text size="sm" fw={600}>{p.quantity}</Text>
                    </Group>
                  ))}
                </Stack>
              )}
            </Paper>
          </SimpleGrid>

          {isEconomia && (
            <Box w="100%">
              <Group justify="space-between" mb="xs" wrap="wrap">
                <Title order={4}>
                  Tickets del dia
                  {' '}
                  <Badge variant="light" color="indigo">{tickets.length}</Badge>
                </Title>
                <TextInput
                  placeholder="Cerca per producte..."
                  value={search}
                  onChange={(e) => setSearch(e.currentTarget.value)}
                  leftSection={<IconSearch size={14} />}
                  w={260}
                />
              </Group>
              <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
                <ScrollArea>
                  <Table withColumnBorders striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Productes</Table.Th>
                        <Table.Th
                          style={{ cursor: 'pointer', userSelect: 'none' }}
                          onClick={() => toggleSort('total')}
                        >
                          <Group gap={4} wrap="nowrap">Total {sortIcon('total')}</Group>
                        </Table.Th>
                        <Table.Th
                          style={{ cursor: 'pointer', userSelect: 'none' }}
                          onClick={() => toggleSort('createdAt')}
                        >
                          <Group gap={4} wrap="nowrap">Creat {sortIcon('createdAt')}</Group>
                        </Table.Th>
                        <Table.Th>Accions</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {visibleTickets.map((t) => (
                        <Table.Tr key={t.id}>
                          <Table.Td>
                            <Group gap={4} wrap="wrap">
                              {t.products
                                .filter((p) => p.name !== PRODUCT_TO_REMOVE)
                                .map((p) => (
                                  <Badge key={p.id} variant="light" color="indigo">
                                    {p.name}
                                    {' x'}
                                    {p.quantity}
                                  </Badge>
                                ))}
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Text fw={600}>
                              {typeof t.total === 'number' ? t.total.toFixed(2) : t.total}
                              {' €'}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">
                              {format(new Date(t.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm')}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <ActionIcon
                              color="red"
                              variant="subtle"
                              onClick={() => setConfirmId(t.id)}
                              aria-label="Esborrar ticket"
                            >
                              <IconTrash size={18} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                      {visibleTickets.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={4}>
                            <Text c="dimmed" ta="center" py="md">
                              No hi ha tickets per a aquest dia.
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            </Box>
          )}
        </>
      )}

      <Modal
        opened={confirmId !== null}
        onClose={() => setConfirmId(null)}
        title="Esborrar ticket"
        size="sm"
      >
        <Stack>
          <Text>Segur que vols esborrar aquest ticket? Aquesta acció no es pot desfer.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmId(null)}>Cancel·lar</Button>
            <Button color="red" onClick={handleDelete}>Esborrar</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default DayView;
