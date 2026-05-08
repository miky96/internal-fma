import React from 'react';
import {
  Paper, Stack, Text, Group, Box,
} from '@mantine/core';

interface Props {
  title: string;
  products: { name: string; quantity: number }[];
  color?: string;
}

const TopProductsCard: React.FC<Props> = ({ title, products, color = 'indigo' }) => {
  const max = Math.max(1, ...products.map((p) => p.quantity));

  return (
    <Paper withBorder p="md" radius="md" shadow="xs">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb="sm">{title}</Text>
      {products.length === 0 ? (
        <Text size="sm" c="dimmed">Sense dades</Text>
      ) : (
        <Stack gap={6}>
          {products.map((p, idx) => (
            <Box key={p.name}>
              <Group justify="space-between" mb={2} wrap="nowrap">
                <Text size="sm" truncate>
                  {idx + 1}
                  .
                  {' '}
                  {p.name}
                </Text>
                <Text size="sm" fw={600}>{p.quantity}</Text>
              </Group>
              <Box
                h={4}
                style={{
                  background: 'var(--mantine-color-gray-2)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box
                  h="100%"
                  style={{
                    width: `${(p.quantity / max) * 100}%`,
                    background: `var(--mantine-color-${color}-6)`,
                  }}
                />
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
};

export default TopProductsCard;
