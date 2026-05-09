// Centralitzem la logica del "dia de negoci" (tall a les 5:00) que abans
// estava duplicada dins d'Inventory.tsx. Si una entrada arriba abans de les
// 5h, comptabilitza com el dia anterior; a partir de les 5h, dia actual.

const adjustToBusinessDayStart = (date: Date): Date => {
  const adjusted = new Date(date);
  adjusted.setHours(date.getHours() < 5 ? -1 : 0, 0, 0, 0);
  return adjusted;
};

// Clau estable (string) per agrupar entries per dia de negoci.
// Usem la data en local time perque el negoci es pensa en hora local.
export const businessDayKey = (date: Date): string => adjustToBusinessDayStart(date).toLocaleDateString();

export const todayBusinessDayKey = (): string => businessDayKey(new Date());

// Marca de temps en segons (compatible amb el format Firestore-like)
// per fer comparacions legacy si calen. Mantenim per si en algun moment
// es vol reintroduir la query Firestore basada en rang.
export const businessDayStartTimestamp = (date: Date): { seconds: number; nanoseconds: number } => ({
  seconds: Math.floor(adjustToBusinessDayStart(date).getTime() / 1000),
  nanoseconds: 0,
});
