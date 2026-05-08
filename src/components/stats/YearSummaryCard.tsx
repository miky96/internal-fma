import React from 'react';
import {
  Paper, Stack, Text, Group, Box, Badge, ThemeIcon,
} from '@mantine/core';
import {
  IconCash, IconReceipt2, IconCalendar, IconTrendingUp, IconTrendingDown,
} from '@tabler/icons-react';
import { EditionSummary } from './editionDayModel';
import { formatEur } from '../tickets/KpiTile';

interface Props {
  edition: EditionSummary;
  color: string;
  // Comparació opcional amb una altra edició (típicament l'any anterior).
  compareWith?: EditionSummary;
}

const pctDelta = (current: number, previous: number): number => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

const formatPct = (n: number): string => {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
};

interface DeltaBadgeProps {
  current: number;
  previous: number;
}

const DeltaBadge: React.FC<DeltaBadgeProps> = ({ current, previous }) => {
  const pct = pctDelta(current, previous);
  if (previous === 0) return null;
  const positive = pct >= 0;
  return (
    <Badge
      size="xs"
      variant="light"
      color={positive ? 'teal' : 'red'}
      leftSection={positive
        ? <IconTrendingUp size={10} />
        : <IconTrendingDown size={10} />}
    >
      {formatPct(pct)}
    </Badge>
  );
};

const YearSummaryCard: React.FC<Props> = ({ edition, color, compareWith }) => (
  <Paper
    withBorder
    radius="md"
    shadow="xs"
    style={{
      overflow: 'hidden',
      borderTop: `3px solid var(--mantine-color-${color}-6)`,
    }}
  >
    <Box
      px="md"
      pt="md"
      pb="xs"
      style={{
        background: `linear-gradient(135deg,
          var(--mantine-color-${color}-0) 0%,
          transparent 100%)`,
      }}
    >
      <Group justify="space-between" align="center">
        <Text fw={700} size="lg" c={`${color}.8`}>
          {edition.year}
        </Text>
        <Badge variant="filled" color={color} radius="sm">
          {edition.days.length}
          {' '}
          dies
        </Badge>
      </Group>
    </Box>

    <Stack gap="sm" p="md">
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon size={32} radius="md" color="teal" variant="light">
            <IconCash size={18} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total</Text>
            <Text fw={700} size="md">{formatEur(edition.total)}</Text>
          </Stack>
        </Group>
        {compareWith && (
          <DeltaBadge current={edition.total} previous={compareWith.total} />
        )}
      </Group>

      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon size={32} radius="md" color="blue" variant="light">
            <IconReceipt2 size={18} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Tickets</Text>
            <Text fw={700} size="md">{edition.ticketCount}</Text>
          </Stack>
        </Group>
        {compareWith && (
          <DeltaBadge
            current={edition.ticketCount}
            previous={compareWith.ticketCount}
          />
        )}
      </Group>

      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon size={32} radius="md" color="orange" variant="light">
            <IconCalendar size={18} />
          </ThemeIcon>
          <Stack gap={0}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Ticket mig</Text>
            <Text fw={700} size="md">{formatEur(edition.avg)}</Text>
          </Stack>
        </Group>
        {compareWith && (
          <DeltaBadge current={edition.avg} previous={compareWith.avg} />
        )}
      </Group>
    </Stack>
  </Paper>
);

export default YearSummaryCard;
