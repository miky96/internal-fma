// Esborra els fitxers temporals que Vite deixa enrere quan transpila vite.config.ts.
// A Windows, Vite sovint no els pot esborrar perquè Node encara els té oberts;
// aquest script s'executa abans de `dev` i `build` per netejar els residus.
import { readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const dirs = ['.', 'node_modules/.vite-temp'];
const prefix = 'vite.config.ts.timestamp-';

let removed = 0;
for (const dir of dirs) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    continue;
  }
  for (const file of entries) {
    if (!file.startsWith(prefix)) continue;
    try {
      unlinkSync(join(dir, file));
      removed += 1;
    } catch {
      // Si està bloquejat per un altre procés, ho deixem estar.
    }
  }
}

if (removed > 0) {
  console.log(`[clean-vite-temp] ${removed} fitxer(s) temporal(s) esborrats`);
}
