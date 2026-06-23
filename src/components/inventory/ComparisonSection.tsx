import React, { useMemo, useState } from 'react';
import {
  Paper, Stack, Group, Title, MultiSelect, Text, Table, ScrollArea, Badge, Box,
} from '@mantine/core';
import { IconChartBar } from '@tabler/icons-react';
import BarChart, { BarSeries } from '../stats/BarChart';
import { InventoryEdition, maxDayCount, sumSelected } from '../../model/inventoryEdition';

interface Props {
  editions: InventoryEdition[];
  productNamesByCategory: { [category: string]: string[] };
}

// Paleta de colors Mantine, un per any. Es repeteix si hi ha més de 8 anys.
const COLORS = ['indigo', 'teal', 'grape', 'orange', 'blue', 'pink', 'lime', 'cyan'];

const formatDate = (iso: string): string => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' });
};

const ComparisonSection: React.FC<Props> = ({ editions, productNamesByCategory }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const selectData = useMemo(() => (
    Object.keys(productNamesByCategory)
      .filter((cat) => productNamesByCategory[cat].length > 0)
      .map((cat) => ({ group: cat, items: productNamesByCategory[cat] }))
  ), [productNamesByCategory]);

  // Edicions amb dades, més recent primer (buildEditions ja ordena desc).
  const usableEditions = useMemo(
    () => editions.filter((e) => e.days.length > 0),
    [editions],
  );
  const maxDays = maxDayCount(usableEditions);
  const dayIndices = useMemo(
    () => Array.from({ length: maxDays }, (_, i) => i + 1),
    [maxDays],
  );

  const series: BarSeries[] = useMemo(() => usableEditions.map((edition, i) => ({
    label: String(edition.year),
    color: COLORS[i % COLORS.length],
    values: dayIndices.map((idx) => {
      const day = edition.days.find((d) => d.index === idx);
      return day ? sumSelected(day, selected) : undefined;
    }),
  })), [usableEditions, dayIndices, selected]);

  const categories = dayIndices.map((idx) => `Dia ${idx}`);

  return (
    <Paper withBorder radius="md" p="md" mt="md">
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap" gap="xs">
          <Group gap="xs">
            <IconChartBar size={20} />
            <Title order={4}>Comparativa entre anys</Title>
          </Group>
          <Badge variant="light" color="indigo">
            {usableEditions.length}
            {usableEditions.length === 1 ? ' any' : ' anys'}
          </Badge>
        </Group>

        <Text size="sm" c="dimmed">
          Tria un o més productes per veure&apos;n l&apos;evolució per dia d&apos;edició
          (1r dia, 2n dia...) i comparar entre anys.
        </Text>

        <MultiSelect
          data={selectData}
          value={selected}
          onChange={setSelected}
          placeholder={selected.length === 0 ? 'Selecciona productes...' : ''}
          searchable
          clearable
          nothingFoundMessage="Cap producte"
          maxDropdownHeight={280}
        />

        {usableEditions.length === 0 || maxDays === 0 ? (
          <Text c="dimmed" ta="center" py="md">Encara no hi ha dades d&apos;inventari.</Text>
        ) : selected.length === 0 ? (
          <Text c="dimmed" ta="center" py="md">
            Selecciona algun producte per començar.
          </Text>
        ) : (
          <Stack gap="lg">
            <Box pt="xs">
              <BarChart categories={categories} series={series} />
            </Box>

            <ScrollArea>
              <Table withColumnBorders striped highlightOnHover miw={360}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Dia</Table.Th>
                    {usableEditions.map((e) => (
                      <Table.Th key={e.year} ta="center">{e.year}</Table.Th>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {dayIndices.map((idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td><Text fw={600} size="sm">{`Dia ${idx}`}</Text></Table.Td>
                      {usableEditions.map((e) => {
                        const day = e.days.find((d) => d.index === idx);
                        if (!day) {
                          return (
                            <Table.Td key={e.year} ta="center">
                              <Text size="sm" c="dimmed">—</Text>
                            </Table.Td>
                          );
                        }
                        return (
                          <Table.Td key={e.year} ta="center">
                            <Text fw={600} size="sm" c="indigo.7">
                              {sumSelected(day, selected)}
                            </Text>
                            <Text size="xs" c="dimmed">{formatDate(day.businessDate)}</Text>
                          </Table.Td>
                        );
                      })}
                    </Table.Tr>
                  ))}
                  <Table.Tr style={{ background: 'var(--mantine-color-gray-1)' }}>
                    <Table.Td><Text fw={700} size="sm">Total</Text></Table.Td>
                    {usableEditions.map((e) => {
                      const total = e.days.reduce((acc, d) => acc + sumSelected(d, selected), 0);
                      return (
                        <Table.Td key={e.year} ta="center">
                          <Text fw={700} size="sm" c="teal.7">{total}</Text>
                        </Table.Td>
                      );
                    })}
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            </ScrollArea>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};

export default ComparisonSection;
