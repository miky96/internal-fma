import {
  useState, useEffect, useRef,
} from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firestore';
import { Ticket } from '../../model/ticket';

// Hook que carrega els tickets de cada any seleccionat de manera incremental.
// Manté una caché per any dins del component pare, així si l'usuari afegeix
// i treu anys no es repeteixen reads de Firestore innecessaris.

export interface YearTickets {
  [year: number]: Ticket[];
}

export const useYearTickets = (years: number[]) => {
  const [data, setData] = useState<YearTickets>({});
  const [loading, setLoading] = useState(false);
  const inFlight = useRef<Set<number>>(new Set());

  useEffect(() => {
    const missing = years.filter(
      (y) => data[y] === undefined && !inFlight.current.has(y),
    );
    if (missing.length === 0) return;

    setLoading(true);
    missing.forEach((y) => inFlight.current.add(y));

    Promise.all(
      missing.map(async (y) => {
        const q = query(collection(db, 'tickets'), where('year', '==', y));
        const snap = await getDocs(q);
        const tks = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Ticket[];
        return [y, tks] as const;
      }),
    )
      .then((entries) => {
        setData((prev) => {
          const next = { ...prev };
          entries.forEach(([y, tks]) => { next[y] = tks; });
          return next;
        });
      })
      .catch((e) => {
        console.error('Error carregant tickets dels anys:', e);
      })
      .finally(() => {
        missing.forEach((y) => inFlight.current.delete(y));
        setLoading(false);
      });
  }, [years, data]);

  return { data, loading };
};
