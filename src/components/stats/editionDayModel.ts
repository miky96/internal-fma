import { Ticket } from '../../model/ticket';
import { aggregateByDay, topProducts, sumTotal } from '../../model/ticketAggregation';

// "Edició" = el conjunt de dies amb activitat dins d'un any. L'índex de dia
// d'edició és la posició cronològica dins d'aquesta edició (1r dia, 2n dia...).
// Ens permet comparar "el primer dia de cada any" encara que no caiguin a
// la mateixa data del calendari (l'any passat va començar el 25, aquest el 27).

export interface EditionDay {
  index: number;            // 1..N
  date: string;             // YYYY-MM-DD del calendari
  total: number;            // facturació del dia
  ticketCount: number;      // nombre de tickets del dia
  avg: number;              // ticket mig del dia
}

export interface EditionSummary {
  year: number;
  days: EditionDay[];
  total: number;
  ticketCount: number;
  avg: number;
  topProducts: { name: string; quantity: number }[];
}

export const buildEdition = (year: number, tickets: Ticket[]): EditionSummary => {
  const aggregated = aggregateByDay(tickets);
  // aggregateByDay retorna les dates ordenades descendentment;
  // per a "primer dia, segon dia..." les volem en ordre cronològic.
  const chrono = [...aggregated].sort((a, b) => (a.date < b.date ? -1 : 1));

  const ticketsByDate: { [date: string]: Ticket[] } = {};
  tickets.forEach((t) => {
    const key = t.businessDate ?? '';
    if (!key) return;
    if (!ticketsByDate[key]) ticketsByDate[key] = [];
    ticketsByDate[key].push(t);
  });

  const days: EditionDay[] = chrono.map((d, i) => {
    const dayTickets = ticketsByDate[d.date] ?? [];
    const ticketCount = dayTickets.length;
    return {
      index: i + 1,
      date: d.date,
      total: d.totalMoney,
      ticketCount,
      avg: ticketCount > 0 ? d.totalMoney / ticketCount : 0,
    };
  });

  const total = sumTotal(tickets);
  const ticketCount = tickets.length;

  return {
    year,
    days,
    total,
    ticketCount,
    avg: ticketCount > 0 ? total / ticketCount : 0,
    topProducts: topProducts(tickets, 5),
  };
};
