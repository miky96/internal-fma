import React from 'react';
import {
  Accordion, Table, ScrollArea, Text, Stack, Paper, Group, Badge,
} from '@mantine/core';
import {
  IconHistory, IconArrowUpRight, IconArrowDownRight, IconMinus,
} from '@tabler/icons-react';
import { InventoryEdition } from '../../model/inventoryEdition';

interface HistorySectionProps {
  // Edicio de l'any en curs (o undefined si encara no n'hi ha).
  edition?: InventoryEdition;
  // productNamesByCategory[categoria] = noms de producte en ordre de visualitzacio.
  productNamesByCategory: { [category: string]: string[] };
  // Clau ISO del dia de negoci actual (s'exclou: ja es veu a les cards de dalt).
  todayKey: string;
}

const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ca-ES', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
};

interface TrendProps { delta: number | null }

const Trend: React.FC<TrendProps> = ({ delta }) => {
  if (delta === null || delta === 0) {
    return <IconMinus size={12} style={{ opacity: 0.3 }} />;
  }
  if (delta > 0) {
    return <IconArrowUpRight size={12} color="var(--mantine-color-teal-6)" />;
  }
  return <IconArrowDownRight size={12} color="var(--mantine-color-red-6)" />;
};

const HistorySection: React.FC<HistorySectionProps> = ({
  edition, productNamesByCategory, todayKey,
}) => {
  // Dies anteriors (cronologic asc), excloent el d'avui.
  const histDays = (edition?.days ?? []).filter((d) => d.businessDate !== todayKey);

  if (histDays.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" mt="md">
        Encara no hi ha historic d&apos;altres dies d&apos;aquest any.
      </Text>
    );
  }

  // Per visualitzacio: del mes recent al mes antic.
  const displayDays = [...histDays].reverse();
  const categories = Object.keys(productNamesByCategory)
    .filter((cat) => productNamesByCategory[cat].length > 0);

  return (
    <Accordion variant="separated" radius="md" mt="md" defaultValue="history">
      <Accordion.Item value="history">
        <Accordion.Control icon={<IconHistory size={18} />}>
          <Group gap="xs">
            <Text fw={600}>Historic d&apos;altres dies</Text>
            <Badge size="sm" variant="light" color="gray">
              {histDays.length}
              {' dies'}
            </Badge>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="lg">
            {categories.map((cat) => {
              const productNames = productNamesByCategory[cat];
              return (
                <Paper key={cat} withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
                  <Group px="md" py="xs" bg="var(--mantine-color-gray-0)">
                    <Text fw={600} size="sm">{cat}</Text>
                  </Group>
                  <ScrollArea>
                    <Table highlightOnHover verticalSpacing="xs" miw={360}>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th
                            style={{
                              whiteSpace: 'nowrap',
                              position: 'sticky',
                              left: 0,
                              background: 'var(--mantine-color-body)',
                              zIndex: 1,
                            }}
                          >
                            Dia
                          </Table.Th>
                          {productNames.map((name) => (
                            <Table.Th key={name} ta="center" style={{ whiteSpace: 'nowrap' }}>
                              {name}
                            </Table.Th>
                          ))}
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {displayDays.map((day) => {
                          const chronoIdx = histDays.indexOf(day);
                          const prev = chronoIdx > 0 ? histDays[chronoIdx - 1] : null;
                          return (
                            <Table.Tr key={day.businessDate}>
                              <Table.Td
                                style={{
                                  whiteSpace: 'nowrap',
                                  position: 'sticky',
                                  left: 0,
                                  background: 'var(--mantine-color-body)',
                                  zIndex: 1,
                                }}
                              >
                                <Group gap={6} wrap="nowrap">
                                  <Badge size="xs" variant="light" color="indigo">
                                    {`Dia ${day.index}`}
                                  </Badge>
                                  <Text size="xs" c="dimmed" tt="capitalize">
                                    {formatDate(day.businessDate)}
                                  </Text>
                                </Group>
                              </Table.Td>
                              {productNames.map((name) => {
                                const cur = day.quantities[name];
                                const hasValue = cur !== undefined;
                                const delta = prev
                                  ? (cur ?? 0) - (prev.quantities[name] ?? 0)
                                  : null;
                                return (
                                  <Table.Td key={name} ta="center">
                                    <Group gap={2} justify="center" wrap="nowrap">
                                      <Text
                                        size="sm"
                                        fw={hasValue ? 600 : 400}
                                        c={hasValue ? undefined : 'dimmed'}
                                      >
                                        {hasValue ? cur : '·'}
                                      </Text>
                                      {hasValue && <Trend delta={delta} />}
                                    </Group>
                                  </Table.Td>
                                );
                              })}
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Paper>
              );
            })}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};

export default HistorySection;
