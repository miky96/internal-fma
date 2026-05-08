import React, { useState } from 'react';
import {
  Box, Group, Text, Paper, Stack,
} from '@mantine/core';

// Bar chart minimal en CSS. Per a 5-15 punts de dades es suficient i ens
// estalvia afegir recharts/chart.js. Multi-serie: cada serie es pinta amb
// un color de Mantine i barres agrupades per categoria.

export interface BarSeries {
  label: string; // ex: any 2025
  color: string; // mantine color (ex: 'indigo')
  values: (number | undefined)[]; // mateixa longitud que categories
}

interface Props {
  categories: string[]; // ex: ['Dia 1', 'Dia 2', ...]
  series: BarSeries[];
  formatValue?: (v: number) => string;
  height?: number;
}

const defaultFormat = (v: number) => v.toFixed(0);

interface HoverState {
  categoryIdx: number;
  x: number;
}

const BarChart: React.FC<Props> = ({
  categories, series, formatValue = defaultFormat, height = 240,
}) => {
  const [hover, setHover] = useState<HoverState | null>(null);

  const max = Math.max(
    1,
    ...series.flatMap((s) => s.values.map((v) => v ?? 0)),
  );

  // Linies horitzontals de referencia (4 trams) per donar profunditat al grafic.
  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <Box style={{ position: 'relative' }}>
      <Group gap="md" mb="sm" wrap="wrap">
        {series.map((s) => (
          <Group key={s.label} gap={6} wrap="nowrap">
            <Box
              w={14}
              h={14}
              style={{
                background: `var(--mantine-color-${s.color}-6)`,
                borderRadius: 4,
                boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.08)',
              }}
            />
            <Text size="sm" fw={500}>{s.label}</Text>
          </Group>
        ))}
      </Group>

      <Box
        style={{
          position: 'relative',
          height,
          padding: '0 4px',
        }}
        onMouseLeave={() => setHover(null)}
      >
        {gridLines.map((p) => (
          <Box
            key={p}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: `${p * 100}%`,
              height: 1,
              background: 'var(--mantine-color-gray-2)',
              pointerEvents: 'none',
            }}
          />
        ))}

        <Box
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: `repeat(${categories.length}, 1fr)`,
            gap: 8,
            alignItems: 'end',
            height: '100%',
            borderBottom: '1px solid var(--mantine-color-gray-4)',
          }}
        >
          {categories.map((cat, i) => {
            const isActive = hover?.categoryIdx === i;
            return (
              <Box
                key={cat}
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  const rect = target.getBoundingClientRect();
                  const parent = target.parentElement as HTMLElement;
                  const parentRect = parent.getBoundingClientRect();
                  setHover({
                    categoryIdx: i,
                    x: rect.left - parentRect.left + rect.width / 2,
                  });
                }}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  gap: 3,
                  height: '100%',
                  cursor: 'pointer',
                  background: isActive ? 'var(--mantine-color-gray-0)' : 'transparent',
                  borderRadius: 4,
                  transition: 'background 120ms ease',
                }}
              >
                {series.map((s) => {
                  const v = s.values[i] ?? 0;
                  const pct = (v / max) * 100;
                  return (
                    <Box
                      key={s.label}
                      style={{
                        flex: 1,
                        height: `${pct}%`,
                        background: `linear-gradient(180deg, var(--mantine-color-${s.color}-5) 0%, var(--mantine-color-${s.color}-7) 100%)`,
                        borderRadius: '4px 4px 0 0',
                        minHeight: v > 0 ? 2 : 0,
                        boxShadow: isActive ? `0 0 0 2px var(--mantine-color-${s.color}-2)` : 'none',
                        transition: 'box-shadow 120ms ease, opacity 120ms ease',
                        opacity: hover && !isActive ? 0.55 : 1,
                      }}
                    />
                  );
                })}
              </Box>
            );
          })}
        </Box>

        {hover && (
          <Paper
            withBorder
            shadow="md"
            p="xs"
            radius="md"
            style={{
              position: 'absolute',
              top: 4,
              left: Math.min(Math.max(hover.x - 90, 0), 9999),
              zIndex: 5,
              pointerEvents: 'none',
              minWidth: 140,
              background: 'white',
            }}
          >
            <Stack gap={2}>
              <Text size="xs" c="dimmed" fw={600}>
                {categories[hover.categoryIdx]}
              </Text>
              {series.map((s) => (
                <Group key={s.label} justify="space-between" gap="xs">
                  <Group gap={6} wrap="nowrap">
                    <Box
                      w={8}
                      h={8}
                      style={{
                        background: `var(--mantine-color-${s.color}-6)`,
                        borderRadius: 2,
                      }}
                    />
                    <Text size="xs">{s.label}</Text>
                  </Group>
                  <Text size="xs" fw={700}>
                    {formatValue(s.values[hover.categoryIdx] ?? 0)}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Paper>
        )}
      </Box>

      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${categories.length}, 1fr)`,
          gap: 8,
          padding: '6px 4px 0',
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
