import React, { useMemo, useState } from 'react';
import {
  Stack, Title, Paper, Group, MultiSelect, Center, Loader, SimpleGrid, Text, Box,
} from '@mantine/core';
import { businessYear } from '../model/businessDate';
import { useYearTickets } from '../components/stats/useYearTickets';
import { buildEdition } from '../components/stats/editionDayModel';
import BarChart from '../components/stats/BarChart';
import YearComparisonTable from '../components/stats/YearComparisonTable';
import TopProductsCard from '../components/stats/TopProductsCard';
import { formatEur } from '../components/tickets/KpiTile';

// Paleta consistent: el primer any agafa indigo, el segon teal, etc.
const SERIES_COLORS = ['indigo', 'teal', 'orange', 'grape', 'blue', 'red'];

const YEARS_BACK = 5;

const buildYearOptions = () => {
  const current = businessYear(new Date());
  const opts: { value: string; label: string }[] = [];
  for (let y = current; y >= current - YEARS_BACK; y -= 1) {
    opts.push({ value: String(y), label: String(y) });
  }
  return opts;
};

const Stats: React.FC = () => {
  const currentYear = businessYear(new Date());
  const [selectedYears, setSelectedYears] = useState<string[]>([String(currentYear)]);

  const yearsNum = useMemo(
    () => selectedYears.map((s) => Number(s)).sort((a, b) => b - a),
    [selectedYears],
  );

  const { data, loading } = useYearTickets(yearsNum);

  const editions = useMemo(
    () => yearsNum
      .filter((y) => data[y])
      .map((y) => buildEdition(y, data[y])),
    [yearsNum, data],
  );

  const yearOptions = buildYearOptions();
  const maxDays = Math.max(0, ...editions.map((e) => e.days.length));
  const dayCategories = Array.from({ length: maxDays }, (_, i) => `Dia ${i + 1}`);

  // Sèrie per gràfic de barres: total per dia d'edició, una sèrie per any.
  const totalSeries = editions.map((e, idx) => ({
    label: String(e.year),
    color: SERIES_COLORS[idx % SERIES_COLORS.length],
    values: dayCategories.map((_, i) => e.days.find((d) => d.index === i + 1)?.total ?? 0),
  }));

  // Sèrie per gràfic de ticket mig per dia d'edició.
  const avgSeries = editions.map((e, idx) => ({
    label: String(e.year),
    color: SERIES_COLORS[idx % SERIES_COLORS.length],
    values: dayCategories.map((_, i) => e.days.find((d) => d.index === i + 1)?.avg ?? 0),
  }));

  return (
    <Stack mt="md" gap="md" w="100%">
      <Title order={2} ta="center">Estadístiques</Title>

      <Paper withBorder p="md" radius="md">
        <Group align="flex-end" gap="sm" wrap="wrap">
          <Box style={{ minWidth: 240, flex: 1 }}>
            <Text size="xs" fw={500} mb={4}>Anys a comparar</Text>
            <MultiSelect
              data={yearOptions}
              value={selectedYears}
              onChange={setSelectedYears}
              placeholder="Tria un o més anys"
              clearable
            />
          </Box>
        </Group>
      </Paper>

      {loading && editions.length === 0 ? (
        <Center h="40vh"><Loader /></Center>
      ) : editions.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Selecciona almenys un any per veure estadístiques.
        </Text>
      ) : (
        <>
          <Paper withBorder p="md" radius="md">
            <Title order={4} mb="sm">Total facturat per dia d&apos;edició</Title>
            <BarChart
              categories={dayCategories}
              series={totalSeries}
              formatValue={formatEur}
            />
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Title order={4} mb="sm">Ticket mig per dia d&apos;edició</Title>
            <BarChart
              categories={dayCategories}
              series={avgSeries}
              formatValue={formatEur}
            />
          </Paper>

          <YearComparisonTable editions={editions} />

          <Box>
            <Title order={4} mb="sm">Top productes per any</Title>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
              {editions.map((e, idx) => (
                <TopProductsCard
                  key={e.year}
                  title={String(e.year)}
                  products={e.topProducts}
                  color={SERIES_COLORS[idx % SERIES_COLORS.length]}
                />
              ))}
            </SimpleGrid>
          </Box>
        </>
      )}
    </Stack>
  );
};

export default Stats;
