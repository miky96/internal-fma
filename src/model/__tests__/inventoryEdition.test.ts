import { describe, it, expect } from 'vitest';
import {
  buildEditions, maxDayCount, sumSelected, allProductNames, InventoryEntryLike,
} from '../inventoryEdition';

const e = (name: string, quantity: number, businessDate: string): InventoryEntryLike => ({
  name, quantity, businessDate,
});

describe('buildEditions', () => {
  it('agrupa per any i ordena els anys de mes recent a mes antic', () => {
    const editions = buildEditions([
      e('Cervesa', 10, '2024-07-25'),
      e('Cervesa', 20, '2026-07-27'),
      e('Cervesa', 15, '2025-07-26'),
    ]);
    expect(editions.map((ed) => ed.year)).toEqual([2026, 2025, 2024]);
  });

  it('assigna index de dia cronologic 1..N dins de cada any', () => {
    const editions = buildEditions([
      e('Cervesa', 1, '2025-07-27'),
      e('Cervesa', 2, '2025-07-25'),
      e('Cervesa', 3, '2025-07-26'),
    ]);
    const days = editions[0].days;
    expect(days).toHaveLength(3);
    expect(days[0]).toMatchObject({ index: 1, businessDate: '2025-07-25' });
    expect(days[1]).toMatchObject({ index: 2, businessDate: '2025-07-26' });
    expect(days[2]).toMatchObject({ index: 3, businessDate: '2025-07-27' });
  });

  it('agrupa quantitats per producte dins del mateix dia', () => {
    const editions = buildEditions([
      e('Cervesa', 10, '2025-07-25'),
      e('Aigua', 5, '2025-07-25'),
    ]);
    expect(editions[0].days[0].quantities).toEqual({ Cervesa: 10, Aigua: 5 });
  });

  it('ignora entrades sense businessDate o amb any invalid', () => {
    const editions = buildEditions([
      e('Cervesa', 10, ''),
      e('Aigua', 5, '2025-07-25'),
    ]);
    expect(editions).toHaveLength(1);
    expect(editions[0].days[0].quantities).toEqual({ Aigua: 5 });
  });
});

describe('maxDayCount', () => {
  it('retorna el maxim de dies entre edicions', () => {
    const editions = buildEditions([
      e('X', 1, '2025-07-25'),
      e('X', 1, '2025-07-26'),
      e('X', 1, '2024-07-25'),
    ]);
    expect(maxDayCount(editions)).toBe(2);
  });

  it('retorna 0 si no hi ha edicions', () => {
    expect(maxDayCount([])).toBe(0);
  });
});

describe('sumSelected', () => {
  it('suma les quantitats dels productes seleccionats', () => {
    const day = { index: 1, businessDate: '2025-07-25', quantities: { A: 3, B: 4, C: 5 } };
    expect(sumSelected(day, ['A', 'C'])).toBe(8);
    expect(sumSelected(day, ['B'])).toBe(4);
    expect(sumSelected(day, ['Z'])).toBe(0);
    expect(sumSelected(day, [])).toBe(0);
  });
});

describe('allProductNames', () => {
  it('retorna tots els noms unics ordenats alfabeticament', () => {
    const editions = buildEditions([
      e('Cervesa', 1, '2025-07-25'),
      e('Aigua', 1, '2025-07-26'),
      e('Cervesa', 1, '2024-07-25'),
    ]);
    expect(allProductNames(editions)).toEqual(['Aigua', 'Cervesa']);
  });
});
