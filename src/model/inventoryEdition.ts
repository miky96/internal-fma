// Model d'"edició" d'inventari per comparar entre anys.
//
// Una "edició" és el conjunt de dies amb registres d'inventari dins d'un any.
// L'índex de dia d'edició és la posició cronològica dins d'aquella edició
// (1r dia, 2n dia...). Així podem comparar "el primer dia de cada any" encara
// que no caiguin a la mateixa data del calendari (l'any passat va començar el
// 25, aquest el 27). Mantenim el mateix concepte que stats/editionDayModel.ts
// perquè les dues vistes parlin el mateix idioma.
//
// L'índex de dia es deriva en temps de lectura (rang cronològic entre dies
// distints de l'any) en lloc de guardar-lo a Firestore. És més robust: si
// s'afegeix un dia anterior a posteriori, la numeració es recalcula sola i no
// queda desincronitzada. El cost és negligible per al volum de dades real.

export interface InventoryEntryLike {
  name: string;
  quantity: number;
  businessDate: string; // 'YYYY-MM-DD' (dia de negoci, tall a les 5h)
}

export interface InventoryDay {
  index: number; // 1..N dins de l'any
  businessDate: string; // 'YYYY-MM-DD'
  quantities: { [product: string]: number };
}

export interface InventoryEdition {
  year: number;
  days: InventoryDay[];
}

// Construeix les edicions a partir d'entrades planes. Última escriptura guanya
// si hi ha dues entrades del mateix producte i dia (no hauria de passar perquè
// Inventory fa update in-place, però ho deixem determinista).
export const buildEditions = (entries: InventoryEntryLike[]): InventoryEdition[] => {
  const byYear = new Map<number, Map<string, { [product: string]: number }>>();

  entries.forEach((e) => {
    if (!e.businessDate) return;
    const year = Number(e.businessDate.slice(0, 4));
    if (Number.isNaN(year)) return;
    if (!byYear.has(year)) byYear.set(year, new Map());
    const daysMap = byYear.get(year)!;
    if (!daysMap.has(e.businessDate)) daysMap.set(e.businessDate, {});
    daysMap.get(e.businessDate)![e.name] = e.quantity;
  });

  return Array.from(byYear.entries())
    .sort((a, b) => b[0] - a[0]) // anys descendents (més recent primer)
    .map(([year, daysMap]) => {
      const dates = Array.from(daysMap.keys()).sort(); // ISO -> ordre cronològic
      const days: InventoryDay[] = dates.map((date, i) => ({
        index: i + 1,
        businessDate: date,
        quantities: daysMap.get(date)!,
      }));
      return { year, days };
    });
};

// Nombre màxim de dies entre totes les edicions (per dimensionar la comparativa).
export const maxDayCount = (editions: InventoryEdition[]): number => (
  Math.max(0, ...editions.map((e) => e.days.length))
);

// Suma de les quantitats dels productes seleccionats en un dia concret.
export const sumSelected = (day: InventoryDay, products: string[]): number => (
  products.reduce((acc, p) => acc + (day.quantities[p] ?? 0), 0)
);

// Conjunt ordenat de tots els noms de producte que apareixen a les edicions.
export const allProductNames = (editions: InventoryEdition[]): string[] => {
  const set = new Set<string>();
  editions.forEach((e) => e.days.forEach((d) => {
    Object.keys(d.quantities).forEach((name) => set.add(name));
  }));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};
