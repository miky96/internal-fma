import React from 'react';
import {
  Paper, Table, Text, ScrollArea, Group, Title, Badge,
} from '@mantine/core';
import { EditionSummary } from './editionDayModel';
import { formatEur } from '../tickets/KpiTile';

interface Props {
  editions: EditionSummary[]; // ordenats per any descendent recomanat
}

// Taula amb files = índex de dia d'edició (1r, 2n...) i columnes = anys.
// Cada cel·la mostra el total de facturació del dia i la data calendari.

const YearComparisonTable: React.FC<Props> = ({ editions }) => {
  const maxDays = Math.max(0, ...editions.map((e) => e.days.length));

  if (editions.length === 0 || maxDays === 0) {
    return (
      <Text c="dimmed" ta="center" py="md">No hi ha dades per comparar.</Text>
    );
  }

  const dayIndices = Array.from({ length: maxDays }, (_, i) => i + 1);

  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
      <Group justify="space-between" px="md" pt="sm">
        <Title order={5}>Comparativa per dia d&apos;edició</Title>
        <Badge variant="light" color="indigo">
          {editions.length}
          {' anys'}
        </Badge>
      </Group>
      <ScrollArea>
        <Table withColumnBorders striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Dia</Table.Th>
              {editions.map((e) => (
                <Table.Th key={e.year}>
                  {e.year}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {dayIndices.map((idx) => (
              <Table.Tr key={idx}>
                <Table.Td>
                  <Text fw={600}>
                    Dia
                    {' '}
                    {idx}
                  </Text>
                </Table.Td>
                {editions.map((e) => {
                  const day = e.days.find((d) => d.index === idx);
                  if (!day) {
                    return (
                      <Table.Td key={e.year}>
                        <Text size="sm" c="dimmed">—</Text>
                      </Table.Td>
                    );
                  }
                  return (
                    <Table.Td key={e.year}>
                      <Text fw={600} c="indigo.7" size="sm">{formatEur(day.total)}</Text>
                      <Text size="xs" c="dimmed">{day.date}</Text>
                      <Text size="xs" c="dimmed">
                        {day.ticketCount}
                        {' tk · '}
                        {formatEur(day.avg)}
                        {' mig'}
                      </Text>
                    </Table.Td>
                  );
                })}
              </Table.Tr>
            ))}
            <Table.Tr style={{ background: 'var(--mantine-color-gray-1)' }}>
              <Table.Td><Text fw={700}>Totals</Text></Table.Td>
              {editions.map((e) => (
                <Table.Td key={e.year}>
                  <Text fw={700} c="teal.7">{formatEur(e.total)}</Text>
                  <Text size="xs" c="dimmed">
                    {e.ticketCount}
                    {' tk · '}
                    {formatEur(e.avg)}
                    {' mig'}
                  </Text>
                </Table.Td>
              ))}
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </ScrollArea>
    </Paper>
  );
};

export default YearComparisonTable;
