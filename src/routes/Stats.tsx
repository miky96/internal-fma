import React, { useMemo, useState } from 'react';
import {
  Stack, Title, Paper, Group, MultiSelect, Center, Loader, SimpleGrid, Text, Box,
  Tabs, ThemeIcon, Badge, Button,
} from '@mantine/core';
import {
  IconChartBar, IconChartLine, IconTable, IconTrophy, IconCalendarStats,
  IconPackage,
} from '@tabler/icons-react';
import { businessYear } from '../model/businessDate';
import { useYearTickets } from '../components/stats/useYearTickets';
import { buildEdition } from '../components/stats/editionDayModel';
import BarChart from '../components/stats/BarChart';
import YearComparisonTable from '../components/stats/YearComparisonTable';
import TopProductsCard from '../components/stats/TopProductsCard';
import YearSummaryCard from '../components/stats/YearSummaryCard';
import { formatEur } from '../components/tickets/KpiTile';

// Paleta consistent: el primer any (mes recent) agafa indigo, el seguent teal, etc.
const SERIES_COLORS = ['indigo', 'teal', 'orange', 'grape', 'blue', 'red'];

const YEARS_BACK = 1;

const buildYearOptions = () => {
  const current = businessYear(new Date());
  const opts: { value: string; label: string }[] = [];
  for (let y = current; y >= current - YEARS_BACK; y -= 1) {
    opts.push({ value: String(y), label: String(y) });
  }
  return opts;
};

const formatUnits = (v: number) => `${Math.round(v).toLocaleString('ca-ES')} u.`;

const Stats: React.FC = () => {
  const currentYear = businessYear(new Date());
  const [selectedYears, setSelectedYears] = useState<string[]>([String(currentYear)]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

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

  const totalSeries = editions.map((e, idx) => ({
    label: String(e.year),
    color: SERIES_COLORS[idx % SERIES_COLORS.length],
    values: dayCategories.map((_, i) => e.days.find((d) => d.index === i + 1)?.total ?? 0),
  }));

  const avgSeries = editions.map((e, idx) => ({
    label: String(e.year),
    color: SERIES_COLORS[idx % SERIES_COLORS.length],
    values: dayCategories.map((_, i) => e.days.find((d) => d.index === i + 1)?.avg ?? 0),
  }));

  // Llista de productes disponibles segons els anys seleccionats.
  const productOptions = useMemo(() => {
    const set = new Set<string>();
    editions.forEach((e) => e.days.forEach((d) => {
      Object.keys(d.products).forEach((n) => set.add(n));
    }));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'ca'));
  }, [editions]);

  const allSelected = productOptions.length > 0
    && selectedProducts.length === productOptions.length;

  // Sèrie d'unitats venudes per dia: per cada any, la suma de les unitats dels
  // productes triats a cada dia d'edició. Mateix format de dies/anys que la resta.
  const unitsSeries = editions.map((e, idx) => ({
    label: String(e.year),
    color: SERIES_COLORS[idx % SERIES_COLORS.length],
    values: dayCategories.map((_, i) => {
      const day = e.days.find((d) => d.index === i + 1);
      if (!day) return 0;
      return selectedProducts.reduce((s, p) => s + (day.products[p] ?? 0), 0);
    }),
  }));

  // Per a la comparativa any vs any anterior als YearSummaryCard.
  const editionByYear: { [year: number]: typeof editions[number] } = {};
  editions.forEach((e) => { editionByYear[e.year] = e; });

  return (
    <Stack mt="md" gap="md" w="100%">
      <Group justify="space-between" align="center" wrap="wrap">
        <Group gap="xs">
          <ThemeIcon size={36} radius="md" variant="light" color="indigo">
            <IconCalendarStats size={22} />
          </ThemeIcon>
          <Stack gap={0}>
            <Title order={2} lh={1.1}>Estadístiques</Title>
            <Text size="xs" c="dimmed">Comparativa per dia d&apos;edicio i top productes</Text>
          </Stack>
        </Group>
        {editions.length > 0 && (
          <Badge size="lg" variant="light" color="indigo">
            {editions.length}
            {editions.length === 1 ? ' any' : ' anys'}
          </Badge>
        )}
      </Group>

      <Paper withBorder p="md" radius="md" shadow="xs">
        <Group align="flex-end" gap="sm" wrap="wrap">
          <Box style={{ minWidth: 240, flex: 1 }}>
            <Text size="xs" fw={600} mb={4} c="dimmed" tt="uppercase">
              Anys a comparar
            </Text>
            <MultiSelect
              data={yearOptions}
              value={selectedYears}
              onChange={setSelectedYears}
              placeholder="Tria un o mes anys"
              clearable
              searchable
            />
          </Box>
        </Group>
      </Paper>

      {loading && editions.length === 0 ? (
        <Center h="40vh"><Loader /></Center>
      ) : editions.length === 0 ? (
        <Paper withBorder p="xl" radius="md">
          <Stack align="center" gap="xs">
            <ThemeIcon size={48} radius="xl" variant="light" color="gray">
              <IconChartBar size={28} />
            </ThemeIcon>
            <Text c="dimmed" ta="center">
              Selecciona almenys un any per veure estadistiques.
            </Text>
          </Stack>
        </Paper>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
            {editions.map((e, idx) => (
              <YearSummaryCard
                key={e.year}
                edition={e}
                color={SERIES_COLORS[idx % SERIES_COLORS.length]}
                compareWith={editionByYear[e.year - 1]}
              />
            ))}
          </SimpleGrid>

          <Paper withBorder radius="md" shadow="xs" style={{ overflow: 'hidden' }}>
            <Tabs defaultValue="total" variant="default" radius={0}>
              <Tabs.List px="md" pt="xs">
                <Tabs.Tab value="total" leftSection={<IconChartBar size={16} />}>
                  Total per dia
                </Tabs.Tab>
                <Tabs.Tab value="avg" leftSection={<IconChartLine size={16} />}>
                  Ticket mig per dia
                </Tabs.Tab>
                <Tabs.Tab value="units" leftSection={<IconPackage size={16} />}>
                  Unitats per producte
                </Tabs.Tab>
                <Tabs.Tab value="table" leftSection={<IconTable size={16} />}>
                  Taula comparativa
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="total" p="md">
                <BarChart
                  categories={dayCategories}
                  series={totalSeries}
                  formatValue={formatEur}
                  height={260}
                />
              </Tabs.Panel>

              <Tabs.Panel value="avg" p="md">
                <BarChart
                  categories={dayCategories}
                  series={avgSeries}
                  formatValue={formatEur}
                  height={260}
                />
              </Tabs.Panel>

              <Tabs.Panel value="units" p="md">
                <Stack gap="sm">
                  <Box style={{ maxWidth: 420 }}>
                    <Group justify="space-between" align="center" mb={4}>
                      <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                        Productes a comptar
                      </Text>
                      <Button
                        variant="subtle"
                        size="compact-xs"
                        onClick={() => setSelectedProducts(allSelected ? [] : productOptions)}
                        disabled={productOptions.length === 0}
                      >
                        {allSelected ? 'Treu tots' : 'Tots els productes'}
                      </Button>
                    </Group>
                    <MultiSelect
                      data={productOptions}
                      value={selectedProducts}
                      onChange={setSelectedProducts}
                      placeholder="Tria un o mes productes"
                      clearable
                      searchable
                      nothingFoundMessage="Cap producte"
                    />
                  </Box>
                  {selectedProducts.length === 0 ? (
                    <Text c="dimmed" size="sm">
                      Selecciona almenys un producte per veure les unitats venudes per dia.
                    </Text>
                  ) : (
                    <BarChart
                      categories={dayCategories}
                      series={unitsSeries}
                      formatValue={formatUnits}
                      height={260}
                    />
                  )}
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="table" p={0}>
                <YearComparisonTable editions={editions} />
              </Tabs.Panel>
            </Tabs>
          </Paper>

          <Box>
            <Group gap="xs" mb="sm">
              <ThemeIcon size={28} radius="md" variant="light" color="grape">
                <IconTrophy size={16} />
              </ThemeIcon>
              <Title order={4}>Top productes per any</Title>
            </Group>
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
