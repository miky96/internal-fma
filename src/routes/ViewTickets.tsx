import React, { useState } from 'react';
import { Stack, Title, Tabs } from '@mantine/core';
import { IconCalendarEvent, IconCalendar } from '@tabler/icons-react';
import DayView from '../components/tickets/DayView';
import YearView from '../components/tickets/YearView';

// La pàgina només decideix entre la vista per dia i la vista per any.
// Cada subvista carrega les seves dades de Firestore (cost només quan
// s'activa la tab) per mantenir baix el nombre de reads.

const ViewTickets: React.FC = () => {
  const [tab, setTab] = useState<string>('day');

  return (
    <Stack mt="md" gap="md" w="100%">
      <Title order={2} ta="center">Veure Tickets</Title>

      <Tabs value={tab} onChange={(v) => setTab(v ?? 'day')} variant="pills" radius="md">
        <Tabs.List>
          <Tabs.Tab value="day" leftSection={<IconCalendarEvent size={16} />}>
            Per dia
          </Tabs.Tab>
          <Tabs.Tab value="year" leftSection={<IconCalendar size={16} />}>
            Per any
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="day" pt="md">
          {tab === 'day' && <DayView />}
        </Tabs.Panel>
        <Tabs.Panel value="year" pt="md">
          {tab === 'year' && <YearView />}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default ViewTickets;
