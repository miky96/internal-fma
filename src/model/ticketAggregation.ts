import { AggregatedData, Ticket } from './ticket';
import { businessDateKeyFromSeconds } from './businessDate';

// Producte que mai s'ha de comptabilitzar (es venia "got" com a item de
// suport per la mecànica del TPV, però no és venda real). Centralitzat aquí
// perquè ViewTickets, YearView i Stats el filtrin igual.
export const PRODUCT_TO_REMOVE = 'Got';

const ticketDayKey = (t: Ticket): string => (
  t.businessDate ?? businessDateKeyFromSeconds(t.createdAt.seconds)
);

export const aggregateByDay = (tickets: Ticket[]): AggregatedData[] => {
  const data: { [date: string]: { [name: string]: number } & { totalMoney: number } } = {};

  tickets.forEach((ticket) => {
    const key = ticketDayKey(ticket);
    if (!data[key]) data[key] = { totalMoney: 0 };
    ticket.products.forEach((p) => {
      if (p.name === PRODUCT_TO_REMOVE) return;
      data[key][p.name] = (data[key][p.name] || 0) + p.quantity;
    });
    data[key].totalMoney += ticket.total;
  });

  return Object.keys(data)
    .sort((a, b) => (a < b ? 1 : -1))
    .map((date) => ({
      date,
      products: data[date],
      totalMoney: data[date].totalMoney,
    }));
};

export const productNamesFrom = (tickets: Ticket[]): string[] => Array.from(
  new Set(tickets.flatMap((t) => t.products.map((p) => p.name))),
).filter((n) => n !== PRODUCT_TO_REMOVE);

export interface TopProduct {
  name: string;
  quantity: number;
}

export const topProducts = (tickets: Ticket[], limit = 3): TopProduct[] => {
  const counts: { [name: string]: number } = {};
  tickets.forEach((t) => {
    t.products.forEach((p) => {
      if (p.name === PRODUCT_TO_REMOVE) return;
      counts[p.name] = (counts[p.name] || 0) + p.quantity;
    });
  });
  return Object.entries(counts)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit);
};

export const sumTotal = (tickets: Ticket[]): number => tickets.reduce((s, t) => s + t.total, 0);
