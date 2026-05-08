import { describe, it, expect } from 'vitest';
import { buildEdition } from '../editionDayModel';
import { Ticket } from '../../../model/ticket';

const mkTicket = (
  id: string,
  businessDate: string,
  total: number,
  products: { name: string; quantity: number }[] = [],
): Ticket => ({
  id,
  total,
  businessDate,
  year: Number(businessDate.slice(0, 4)),
  createdAt: { seconds: 1700000000, nanoseconds: 0 },
  products: products.map((p, i) => ({
    id: i, name: p.name, quantity: p.quantity, price: 1,
  })),
});

describe('buildEdition', () => {
  it('ordena els dies cronologicament i assigna index 1..N', () => {
    const tickets: Ticket[] = [
      mkTicket('a', '2025-07-27', 10),
      mkTicket('b', '2025-07-25', 20),
      mkTicket('c', '2025-07-26', 15),
    ];
    const edition = buildEdition(2025, tickets);

    expect(edition.year).toBe(2025);
    expect(edition.days).toHaveLength(3);
    expect(edition.days[0]).toMatchObject({ index: 1, date: '2025-07-25', total: 20 });
    expect(edition.days[1]).toMatchObject({ index: 2, date: '2025-07-26', total: 15 });
    expect(edition.days[2]).toMatchObject({ index: 3, date: '2025-07-27', total: 10 });
  });

  it('calcula ticket mig per dia (avg)', () => {
    const tickets: Ticket[] = [
      mkTicket('a', '2025-07-25', 10),
      mkTicket('b', '2025-07-25', 30),
      mkTicket('c', '2025-07-26', 5),
    ];
    const edition = buildEdition(2025, tickets);

    const day1 = edition.days[0];
    expect(day1.ticketCount).toBe(2);
    expect(day1.avg).toBe(20); // (10+30)/2

    const day2 = edition.days[1];
    expect(day2.ticketCount).toBe(1);
    expect(day2.avg).toBe(5);
  });

  it('agrega totals i ticket mig globals de l\'any', () => {
    const tickets: Ticket[] = [
      mkTicket('a', '2025-07-25', 10),
      mkTicket('b', '2025-07-26', 30),
      mkTicket('c', '2025-07-26', 60),
    ];
    const edition = buildEdition(2025, tickets);
    expect(edition.total).toBe(100);
    expect(edition.ticketCount).toBe(3);
    expect(edition.avg).toBeCloseTo(33.333, 2);
  });

  it('inclou top productes (sense Got)', () => {
    const tickets: Ticket[] = [
      mkTicket('a', '2025-07-25', 10, [
        { name: 'Cervesa', quantity: 5 },
        { name: 'Got', quantity: 99 },
      ]),
      mkTicket('b', '2025-07-26', 5, [
        { name: 'Cervesa', quantity: 1 },
        { name: 'Aigua', quantity: 3 },
      ]),
    ];
    const edition = buildEdition(2025, tickets);

    expect(edition.topProducts.length).toBeGreaterThan(0);
    expect(edition.topProducts.find((p) => p.name === 'Got')).toBeUndefined();

    const cervesa = edition.topProducts.find((p) => p.name === 'Cervesa');
    expect(cervesa?.quantity).toBe(6);
  });

  it('retorna edicio buida si no hi ha tickets', () => {
    const edition = buildEdition(2025, []);
    expect(edition.days).toEqual([]);
    expect(edition.total).toBe(0);
    expect(edition.ticketCount).toBe(0);
    expect(edition.avg).toBe(0);
    expect(edition.topProducts).toEqual([]);
  });
});
