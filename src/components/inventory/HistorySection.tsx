import React from 'react';
import {
  Accordion, Table, ScrollArea, Text, Stack, Title,
} from '@mantine/core';
import { IconHistory } from '@tabler/icons-react';

interface HistorySectionProps {
  // groupedEntries[date][productName] = quantity
  groupedEntries: { [date: string]: { [productName: string]: number } };
  // productNamesByCategory[categoryName] = list of product names in display order
  productNamesByCategory: { [category: string]: string[] };
  todayKey: string;
}

const HistorySection: React.FC<HistorySectionProps> = ({
  groupedEntries, productNamesByCategory, todayKey,
}) => {
  // Filtrem el dia d'avui de l'historic - ja es veu a les cards de dalt.
  // Ordenem dies de mes recent a mes antic perque l'usuari vulgui veure
  // primer el de fa poc.
  const dates = Object.keys(groupedEntries)
    .filter((d) => d !== todayKey)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (dates.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" mt="md">
        Encara no hi ha historic d&apos;altres dies.
      </Text>
    );
  }

  const categories = Object.keys(productNamesByCategory);

  return (
    <Accordion variant="separated" radius="md" mt="md">
      <Accordion.Item value="history">
        <Accordion.Control icon={<IconHistory size={18} />}>
          <Text fw={600}>Historic d&apos;altres dies</Text>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="md">
            {categories.map((cat) => {
              const productNames = productNamesByCategory[cat];
              if (productNames.length === 0) return null;
              return (
                <Stack gap={4} key={cat}>
                  <Title order={5}>{cat}</Title>
                  <ScrollArea>
                    <Table withTableBorder withColumnBorders striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th style={{ whiteSpace: 'nowrap' }}>Data</Table.Th>
                          {productNames.map((name) => (
                            <Table.Th key={name} style={{ whiteSpace: 'nowrap' }}>{name}</Table.Th>
                          ))}
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {dates.map((date) => (
                          <Table.Tr key={date}>
                            <Table.Td style={{ whiteSpace: 'nowrap' }}>{date}</Table.Td>
                            {productNames.map((name) => (
                              <Table.Td key={name}>
                                {groupedEntries[date]?.[name] ?? 0}
                              </Table.Td>
                            ))}
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </ScrollArea>
                </Stack>
              );
            })}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};

export default HistorySection;
