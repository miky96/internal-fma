import React from 'react';
import { Box, Group, Text } from '@mantine/core';

// Bar chart minimal en CSS. Per a 5-15 punts de dades és suficient i ens
// estalvia afegir recharts/chart.js. Multi-sèrie: cada sèrie es pinta amb
// un color de Mantine i barres agrupades per categoria.

export interface BarSeries {
  label: string;       // ex: any 2025
  color: string;       // mantine color (ex: 'indigo')
  values: (number | undefined)[];   // mateixa longitud que categories
}

interface Props {
  categories: string[]; // ex: ['Dia 1', 'Dia 2', ...]
  series: BarSeries[];
  formatValue?: (v: number) => string;
  height?: number;
}

const defaultFormat = (v: number) => v.toFixed(0);

const BarChart: React.FC<Props> = ({
  categories, series, formatValue = defaultFormat, height = 220,
}) => {
  const max = Math.max(
    1,
    ...series.flatMap((s) => s.values.map((v) => v ?? 0)),
  );

  return (
    <Box>
      <Group gap="md" mb="xs" wrap="wrap">
        {series.map((s) => (
          <Group key={s.label} gap={6} wrap="nowrap">
            <Box w={12} h={12} bg={`var(--mantine-color-${s.color}-6)`} style={{ borderRadius: 3 }} />
            <Text size="sm">{s.label}</Text>
          </Group>
        ))}
      </Group>

      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${categories.length}, 1fr)`,
          gap: 8,
          alignItems: 'end',
          height,
          padding: '0 4px',
          borderBottom: '1px solid var(--mantine-color-gray-3)',
        }}
      >
        {categories.map((cat, i) => (
          <Box
            key={cat}
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: 2,
              height: '100%',
            }}
          >
            {series.map((s) => {
              const v = s.values[i] ?? 0;
              const pct = (v / max) * 100;
              return (
                <Box
                  key={s.label}
                  title={`${s.label}: ${formatValue(v)}`}
                  style={{
                    flex: 1,
                    height: `${pct}%`,
                    background: `var(--mantine-color-${s.color}-6)`,
                    borderRadius: '3px 3px 0 0',
                    minHeight: v > 0 ? 2 : 0,
                  }}
                />
              );
            })}
          </Box>
        ))}
      </Box>

      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${categories.length}, 1fr)`,
          gap: 8,
          padding: '4px 4px 0',
        }}
      >
        {categories.map((c) => (
          <Text key={c} size="xs" ta="center" c="dimmed" truncate>{c}</Text>
        ))}
      </Box>
    </Box>
  );
};

export default BarChart;
