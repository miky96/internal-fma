import React from 'react';
import {
  Paper, Group, Stack, Text, Title, Box,
} from '@mantine/core';

interface Props {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const KpiTile: React.FC<Props> = ({ label, value, icon, color }) => (
  <Paper withBorder p="md" radius="md" shadow="xs">
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <Stack gap={2}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
        <Title order={3} lh={1.1}>{value}</Title>
      </Stack>
      <Box
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `var(--mantine-color-${color}-light)`,
          color: `var(--mantine-color-${color}-7)`,
        }}
      >
        {icon}
      </Box>
    </Group>
  </Paper>
);

export default KpiTile;

export const formatEur = (n: number) => `${n.toFixed(2)} €`;
