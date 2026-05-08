import { describe, it, expect } from 'vitest';
import {
  businessDateFromDate,
  businessDateKey,
  businessYear,
  businessDateKeyFromSeconds,
  businessYearFromSeconds,
} from '../businessDate';

// Aquests tests blinden la regla de tall a les 5h, que es el contracte
// fonamental de tota l'app: AddTicket, ViewTickets, agregats i Stats han
// de tractar l'hora de la mateixa manera. Si aixo es trenca, els numeros
// d'una nit "post-mitjanit" passen al dia equivocat.

describe('businessDate - regla de tall a les 5h', () => {
  it('un ticket de les 23h compta com a venda del mateix dia', () => {
    const d = new Date(2025, 6, 25, 23, 30); // 25 jul 2025, 23:30
    expect(businessDateKey(d)).toBe('2025-07-25');
    expect(businessYear(d)).toBe(2025);
  });

  it('un ticket de les 02h compta com a venda del dia anterior', () => {
    // 26 jul 02:30 -> dia de venda 25 jul
    const d = new Date(2025, 6, 26, 2, 30);
    expect(businessDateKey(d)).toBe('2025-07-25');
  });

  it('un ticket a les 04:59:59 encara compta com a dia anterior', () => {
    const d = new Date(2025, 6, 26, 4, 59, 59);
    expect(businessDateKey(d)).toBe('2025-07-25');
  });

  it('un ticket a les 05:00 ja compta com el nou dia', () => {
    const d = new Date(2025, 6, 26, 5, 0, 0);
    expect(businessDateKey(d)).toBe('2025-07-26');
  });

  it('cas frontera: 1 gener 02:00 -> 31 desembre any anterior', () => {
    const d = new Date(2026, 0, 1, 2, 0);
    expect(businessDateKey(d)).toBe('2025-12-31');
    expect(businessYear(d)).toBe(2025);
  });

  it('businessDateFromDate normalitza a 00:00 local', () => {
    const d = new Date(2025, 6, 25, 18, 45, 30);
    const result = businessDateFromDate(d);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it('helpers a partir de timestamp en segons (Firestore)', () => {
    // 2025-07-25 23:30:00 local
    const seconds = Math.floor(new Date(2025, 6, 25, 23, 30).getTime() / 1000);
    expect(businessDateKeyFromSeconds(seconds)).toBe('2025-07-25');
    expect(businessYearFromSeconds(seconds)).toBe(2025);
  });

  it('format de la clau es YYYY-MM-DD amb pad de zeros', () => {
    const d = new Date(2025, 0, 5, 12, 0); // 5 gener
    expect(businessDateKey(d)).toBe('2025-01-05');
  });
});
