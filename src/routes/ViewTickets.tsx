import React, { useState, useEffect, useContext } from 'react';
import {
  collection, getDocs, deleteDoc, doc,
} from 'firebase/firestore';
import {
  Stack, Title, Table, ActionIcon, Box,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { format, addDays } from 'date-fns';
import { db } from '../firebase/firestore';
import { AuthContext } from '../context/AuthContext';
import { AggregatedData, Ticket } from '../model/ticket';

const productToRemove = 'Got';

const ViewTickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [aggregatedData, setAggregatedData] = useState<AggregatedData[]>([]);
  const { currentUser } = useContext(AuthContext);

  const aggregateData = (tckts: Ticket[]): AggregatedData[] => {
    const data: { [date: string]: { [productName: string]: number } & { totalMoney: number } } = {};

    tckts.forEach((ticket) => {
      const ticketDate = new Date(ticket.createdAt.seconds * 1000);
      let startOfDay = new Date(ticketDate);
      startOfDay.setHours(5, 0, 0, 0);

      if (ticketDate.getHours() < 5) {
        startOfDay = addDays(startOfDay, -1);
        startOfDay.setHours(5, 0, 0, 0);
      }

      const dateKey = format(startOfDay, 'yyyy-MM-dd');

      if (!data[dateKey]) {
        data[dateKey] = { totalMoney: 0 };
      }

      ticket.products.forEach((product) => {
        if (product.name !== productToRemove) {
          if (!data[dateKey][product.name]) {
            data[dateKey][product.name] = 0;
          }
          data[dateKey][product.name] += product.quantity;
        }
      });

      data[dateKey].totalMoney += ticket.total;
    });

    return Object.keys(data).map((date) => ({
      date,
      products: data[date],
      totalMoney: data[date].totalMoney,
    }));
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'tickets'));
        const ticketsData = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Ticket[];
        setTickets(ticketsData);
        setAggregatedData(aggregateData(ticketsData));
      } catch (error) {
        console.error('Error carregant tickets: ', error);
      }
    };
    fetchTickets();
  }, []);

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await deleteDoc(doc(db, 'tickets', ticketId));
      const updatedTickets = tickets.filter((ticket) => ticket.id !== ticketId);
      setTickets(updatedTickets);
      setAggregatedData(aggregateData(updatedTickets));
      notifications.show({ color: 'green', message: 'Ticket borrat correctament!' });
    } catch (error) {
      console.error('Error eliminant document: ', error);
      notifications.show({ color: 'red', message: 'Error eliminant ticket. Torna-ho a intentar.' });
    }
  };

  const productNames = Array.from(
    new Set(tickets.flatMap((ticket) => ticket.products.map((p) => p.name))),
  ).filter((n) => n !== productToRemove);

  return (
    <Stack align="center" mt="md" gap="md">
      <Title order={2}>Veure Tickets</Title>

      <Box w="100%">
        <Title order={4} mb="xs">Productes diaris venguts</Title>
        <Table withTableBorder withColumnBorders striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Data</Table.Th>
              {productNames.map((name) => (
                <Table.Th key={name}>{name}</Table.Th>
              ))}
              <Table.Th>Diners totals</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {aggregatedData.map((data) => (
              <Table.Tr key={data.date}>
                <Table.Td>{data.date}</Table.Td>
                {productNames.map((name) => (
                  <Table.Td key={name}>{data.products[name] || 0}</Table.Td>
                ))}
                <Table.Td>
                  {data.totalMoney.toFixed(2)}
                  {' '}
                  €
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>

      {currentUser?.email === 'adminfma@gmail.com' && (
        <Box w="100%" mt="md">
          <Title order={4} mb="xs">Tickets fets</Title>
          <Table withTableBorder withColumnBorders striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Productes</Table.Th>
                <Table.Th>Total</Table.Th>
                <Table.Th>Creat</Table.Th>
                <Table.Th>Accions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tickets.map((ticket) => (
                <Table.Tr key={ticket.id}>
                  <Table.Td>
                    {ticket.products.map((product) => (
                      <div key={product.id}>
                        {product.name}
                        {' '}
                        (x
                        {product.quantity}
                        )
                      </div>
                    ))}
                  </Table.Td>
                  <Table.Td>
                    €
                    {typeof ticket.total === 'number' ? ticket.total.toFixed(2) : ticket.total}
                  </Table.Td>
                  <Table.Td>
                    {format(new Date(ticket.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm')}
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="subtle"
                      onClick={() => handleDeleteTicket(ticket.id)}
                      aria-label="Esborrar ticket"
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
      )}
    </Stack>
  );
};

export default ViewTickets;
