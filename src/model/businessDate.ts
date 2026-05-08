// Lògica del "dia de venda" (business date).
//
// Un ticket creat entre les 00:00 i les 04:59 d'un dia X compta com a venda
// del dia X-1, perquè cobrim festes nocturnes que travessen mitjanit.
// Per això tots els llocs (escriptura de tickets, vista, agregats, migració)
// han de fer servir EXACTAMENT aquesta funció — la consistència és crítica.

const DAY_CUTOFF_HOUR = 5;

const pad2 = (n: number) => String(n).padStart(2, '0');

export const businessDateFromDate = (date: Date): Date => {
  const d = new Date(date);
  if (d.getHours() < DAY_CUTOFF_HOUR) {
    d.setDate(d.getDate() - 1);
  }
  d.setHours(0, 0, 0, 0);
  return d;
};

export const businessDateKey = (date: Date): string => {
  const d = businessDateFromDate(date);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

export const businessYear = (date: Date): number => businessDateFromDate(date).getFullYear();

// Helper per a Firestore Timestamp-like ({ seconds, nanoseconds }).
export const businessDateKeyFromSeconds = (seconds: number): string => (
  businessDateKey(new Date(seconds * 1000))
);

export const businessYearFromSeconds = (seconds: number): number => (
  businessYear(new Date(seconds * 1000))
);

// Per a inputs <input type="date"> (YYYY-MM-DD locals, no UTC).
export const todayBusinessDateKey = (): string => businessDateKey(new Date());
