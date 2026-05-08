import { describe, it, expect } from 'vitest';
import {
  aggregateByDay,
  productNamesFrom,
  topProducts,
  sumTotal,
  PRODUCT_TO_REMOVE,
} from '../ticketAggregation';
import { Ticket } from '../ticket';

// Helper per crear tickets sintetics amb camps minims.
const mkTicket = (
  id: string,
  businessDate: string,
  total: number,
  products: { name: string; quantity: number; price?: number }[],
  createdAtSec = 1700000000,
): Ticket => ({
  id,
  total,
  businessDate,
  year: Number(businessDate.slice(0, 4)),
  createdAt: { seconds: createdAtSec, nanoseconds: 0 },
  // L'API de tickets fa servir name, quantity, price i id num.
  products: products.map((p, i) => ({
    id: i,
    name: p.name,
    quantity: p.quantity,
    price: p.price ?? 1,
  })),
});

describe('aggregateByDay', () => {
  it('agrupa tickets per businessDate i suma quantitats per producte', () => {
    const tickets: Ticket[] = [
      mkTicket('a', '2025-07-25', 10, [{ name: 'Cervesa', quantity: 2 }]),
      mkTicket('b', '2025-07-25', 5, [{ name: 'Cervesa', quantity: 1 }, { name: 'Aigua', quantity: 1 }]),
      mkTicket('c', '2025-07-26', 7, [{ name: 'Aigua', quantity: 1 }]),
    ];

    const result = aggregateByDay(tickets);

    // L'ordre per defecte es descendent per data.
    expect(result.map((r) => r.date)).toEqual(['2025-07-26', '2025-07-25']);

    const day25 = result.find((r) => r.date === '2025-07-25')!;
    expect(day25.totalMoney).toBe(15);
    expect(day25.products.Cervesa).toBe(3);
    expect(day25.products.Aigua).toBe(1);
  });

  it("filtra el producte 'Got' (no es venda real)", () => {
    const tickets: Ticket[] = [
      mkTicket('a', '2025-07-25', 10, [
        { name: 'Cervesa', quantity: 2 },
        { name: PRODUCT_TO_REMOVE, quantity: 5 },
      ]),
    ];

    const [day] = aggregateByDay(tickets);
    expect(day.products.Cervesa).toBe(2);
    expect(day.products[PRODUCT_TO_REMOVE]).toBeUndefined();
    // El total monetari del ticket NO es recalcula aqui; ja ve filtrat
    // a l'escriptura. Aixi, totalMoney es el total guardat al document.
    expect(day.totalMoney).toBe(10);
  });

  it("usa createdAt si no hi ha businessDate (compatibilitat amb tickets antics)", () => {
    // 2024-08-15 14:30 local -> businessDate 2024-08-15
    const seconds = Math.floor(new Date(2024, 7, 15, 14, 30).getTime() / 1000);
    const ticket: Ticket = {
      id: 'old',
      total: 5,
      products: [{ id: 0, name: 'Aigua', quantity: 1, price: 1 }],
      createdAt: { seconds, nanoseconds: 0 },
    };
    const [day] = aggregateByDay([ticket]);
    expect(day.date).toBe('2024-08-15');
    expect(day.products.Aigua).toBe(1);
  });

  it('retorna llista buida amb input buit', () => {
    expect(aggregateByDay([])).toEqual([]);
  });
});

describe('productNamesFrom', () => {
  it('retorna noms unics, sense Got', () => {
    const tickets: Ticket[] = [
      mkTicket('a', '2025-07-25', 10, [
        { name: 'Cervesa', quantity: 1 },
        { name: 'Got', quantity: 1 },
      ]),
      mkTicket('b', '2025-07-25', 5, [
        { name: 'Cervesa', quantity: 1 },
        { name: 'Aigua', quantity: 1 },
      ]),
    ];
    const names = productNamesFrom(tickets);
    expect(new Set(names)).toEqual(new Set(['Cervesa', 'Aigua']));
    expect(names).not.toContain('Got');
  });
});

describe('topProducts', () => {
  it('ordena per quantitat descendent i respecta el limit', () => {
    const tickets: Ticket[] = [
      mkTicket('a', '2025-07-25', 1, [
        { name: 'Cervesa', quantity: 5 },
        { name: 'Aigua', quantity: 2 },
        { name: 'Vi', quantity: 1 },
        { name: 'Refresc', quantity: 8 },
      ]),
    ];

    const top2 = topProducts(tickets, 2);
    expect(top2).toHaveLength(2);
    expect(top2[0]).toEqual({ name: 'Refresc', quantity: 8 });
    expect(top2[1]).toEqual({ name: 'Cervesa', quantity: 5 });
  });

  it("ignora el producte 'Got'", () => {
    const tickets: Ticket[] = [
      mkTicket('a', '2025-07-25', 1, [
        { name: PRODUCT_TO_REMOVE, quantity: 100 },
        { name: 'Cervesa', quantity: 3 },
      ]),
    ];
    const top = topProducts(tickets, 5);
    expect(top.find((p) => p.name === PRODUCT_TO_REMOVE)).toBeUndefined();
    expect(top[0]).toEqual({ name: 'Cervesa', quantity: 3 });
  });
});

describe('sumTotal', () => {
  it('suma totals de tots els tickets', () => {
    const tickets: Ticket[] = [
      mkTicket('a', '2025-07-25', 12.5, []),
      mkTicket('b', '2025-07-25', 7.25, []),
      mkTicket('c', '2025-07-26', 3, []),
    ];
    expect(sumTotal(tickets)).toBeCloseTo(22.75, 2);
  });

  it('zero amb input buit', () => {
    expect(sumTotal([])).toBe(0);
  });
});
