import React, {
  useState, useEffect, useMemo, useCallback,
} from 'react';
import {
  collection, query, where, getDocs,
} from 'firebase/firestore';
import {
  Stack, Paper, Group, Text, Title, Badge, ScrollArea, Table, Center, Loader,
  Select, Box, SimpleGrid,
} from '@mantine/core';
import { IconCash, IconReceipt2, IconCalendar } from '@tabler/icons-react';
import { db } from '../../firebase/firestore';
import { Ticket } from '../../model/ticket';
import {
  aggregateByDay, productNamesFrom, sumTotal,
} from '../../model/ticketAggregation';
import { businessYear } from '../../model/businessDate';
import KpiTile, { formatEur } from './KpiTile';

const YEARS_BACK = 5;

const buildYearOptions = (): { value: string; label: string }[] => {
  const current = businessYear(new Date());
  const opts: { value: string; label: string }[] = [];
  for (let y = current; y >= current - YEARS_BACK; y -= 1) {
    opts.push({ value: String(y), label: String(y) });
  }
  return opts;
};

const YearView: React.FC = () => {
  const [year, setYear] = useState<number>(businessYear(new Date()));
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchYear = useCallback(async (y: number) => {
    setLoading(true);
    try {
      const q = query(collection(db, 'tickets'), where('year', '==', y));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Ticket[];
      setTickets(data);
    } catch (e) {
      console.error('Error carregant tickets de l\'any:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchYear(year); }, [year, fetchYear]);

  const aggregated = useMemo(() => aggregateByDay(tickets), [tickets]);
  const productNames = useMemo(() => productNamesFrom(tickets), [tickets]);

  const yearKpis = useMemo(() => {
    const total = sumTotal(tickets);
    const count = tickets.length;
    const avg = count > 0 ? total / count : 0;
    return { total, count, avg, days: aggregated.length };
  }, [tickets, aggregated]);

  const yearOptions = buildYearOptions();

  return (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md">
        <Group align="flex-end" gap="sm" wrap="wrap">
          <Box>
            <Text size="xs" fw={500} mb={4}>Any</Text>
            <Select
              value={String(year)}
              onChange={(v) => v && setYear(Number(v))}
              data={yearOptions}
              w={140}
              allowDeselect={false}
            />
          </Box>
        </Group>
      </Paper>

      {loading ? (
        <Center h="40vh"><Loader /></Center>
      ) : (
        <>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            <KpiTile label="Total any" value={formatEur(yearKpis.total)} icon={<IconCash size={20} />} color="teal" />
            <KpiTile label="Tickets" value={String(yearKpis.count)} icon={<IconReceipt2 size={20} />} color="blue" />
            <KpiTile label="Ticket mig" value={formatEur(yearKpis.avg)} icon={<IconCash size={20} />} color="orange" />
            <KpiTile label="Dies amb activitat" value={String(yearKpis.days)} icon={<IconCalendar size={20} />} color="indigo" />
          </SimpleGrid>

          <Box w="100%">
            <Group justify="space-between" mb="xs">
              <Title order={4}>Productes diaris venguts</Title>
              <Badge variant="light" color="indigo">
                {aggregated.length}
                {' '}
                dies
              </Badge>
            </Group>
            <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
              <ScrollArea>
                <Table withColumnBorders striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Data</Table.Th>
                      {productNames.map((name) => (
                        <Table.Th key={name}>{name}</Table.Th>
                      ))}
                      <Table.Th>Diners totals</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {aggregated.map((d) => (
                      <Table.Tr key={d.date}>
                        <Table.Td><Text fw={600}>{d.date}</Text></Table.Td>
                        {productNames.map((name) => (
                          <Table.Td key={name}>{d.products[name] || 0}</Table.Td>
                        ))}
                        <Table.Td>
                          <Text fw={600} c="indigo.7">
                            {d.totalMoney.toFixed(2)}
                            {' €'}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    {aggregated.length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={productNames.length + 2}>
                          <Text c="dimmed" ta="center" py="md">
                            No hi ha dades per a aquest any.
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Paper>
          </Box>
        </>
      )}
    </Stack>
  );
};

export default YearView;
