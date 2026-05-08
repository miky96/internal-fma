# internal-fma

Eina interna de gestió de vendes per a la Festa Major. Permet registrar tickets de venda (TPV), consultar l'inventari, veure estadístiques agregades i gestionar productes. És una web app privada, accessible només amb credencials.

---

## Tecnologies

| Capa | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript |
| Bundler | Vite |
| UI | Mantine 7 |
| Base de dades | Firestore (Firebase) |
| Autenticació | Firebase Auth (email/password) |
| Hosting | Firebase Hosting |
| CI/CD | GitHub Actions |

---

## Arquitectura general

```
GitHub (codi font)
    │
    ├── PR → GitHub Actions (lint + typecheck + build)
    │
    └── merge a master → GitHub Actions → Firebase Hosting (producció)
                                  │
                              Firebase
                            ┌────┴────┐
                         Auth      Firestore
                     (usuaris)   (tickets, productes)
```

L'app és una **SPA (Single Page Application)** estàtica. No hi ha backend propi: tota la lògica de dades va directament contra Firebase des del navegador. El cost d'infraestructura és pràcticament zero (Firebase Spark és gratuït per al volum d'ús d'una festa major).

---

## Infraestructura Firebase

El projecte Firebase es diu **`tool-fma-c8f4b`** i utilitza tres serveis:

### Firebase Auth
Gestiona l'autenticació via email i contrasenya. No hi ha registre públic: els comptes es creen manualment des de la consola de Firebase.

### Firestore
Base de dades NoSQL on es guarden dues col·leccions principals:
- **`tickets`** — cada document és un ticket de venda, amb la llista de productes, el total i la data de creació. Els tickets nous inclouen els camps denormalitzats `businessDate` (YYYY-MM-DD) i `year` per facilitar queries per dia.
- **`products`** — catàleg de productes amb nom, preu, imatge i tipus (BARRA o MERCHANDISING).

### Firebase Hosting
Serveix el `dist/` generat per Vite. Totes les rutes es redirigeixen a `index.html` (SPA mode). La URL de producció és la que assigna Firebase al projecte.

---

## Roles i permisos

Els permisos es basen en l'email de l'usuari autenticat (lògica al client, a `MainPage.tsx`):

| Rol | Email | Accés |
|---|---|---|
| **admin** | `adminfma@gmail.com` | Tot |
| **marta** | `martafma@gmail.com` | Afegir tickets + Editar productes |
| **inventari** | `inventarifma@gmail.com` | Afegir tickets + Inventari |
| **economia** | `economiafma@gmail.com` | Afegir tickets + Veure tickets + Estadístiques |
| (base) | qualsevol altre | Només afegir tickets |

Els rols són acumulatius: `admin` inclou tot, `inventari` inclou economia, etc.

---

## Business date (dia de venda)

Els tickets creats entre les **00:00 i les 04:59** d'un dia X compten com a venda del **dia X-1**, perquè les festes cobreixen la nit i travessen mitjanit.

Aquesta lògica viu a `src/model/businessDate.ts` i s'aplica de forma consistent a tot arreu: escriptura de tickets, vistes, agregats i estadístiques.

---

## Estructura del codi

```
src/
├── App.tsx                  # Routing arrel + lazy loading de MainPage
├── context/
│   └── AuthContext.tsx      # Estat global d'autenticació (React Context)
├── firebase/
│   ├── firebaseSetup.ts     # Inicialització de l'app i auth (carregat sempre)
│   ├── firebase.ts          # Funcions d'auth (signIn, signOut, listener)
│   └── firestore.ts         # Instància de Firestore (carregada lazy)
├── model/
│   ├── ticket.ts            # Tipus: Ticket, Product, TicketItem, ProductTypes
│   ├── ticketAggregation.ts # Lògica d'agregació de tickets per dia i estadístiques
│   ├── inventory.ts         # Tipus d'inventari
│   └── businessDate.ts      # Lògica del dia de venda (tall a les 5h)
├── routes/
│   ├── Home.tsx             # Pantalla de login
│   ├── MainPage.tsx         # Shell de l'app: header, menú lateral, sub-rutes
│   ├── AddTicket.tsx        # TPV per registrar vendes
│   ├── ViewTickets.tsx      # Consulta de tickets per dia
│   ├── Stats.tsx            # Estadístiques i gràfics
│   ├── Inventory.tsx        # Gestió d'inventari
│   └── EditProduct.tsx      # Edició del catàleg de productes
└── components/
    ├── RequireAuth.tsx
    ├── tickets/             # KpiTile, DayView, YearView
    └── stats/               # BarChart, TopProductsCard, YearComparisonTable
```

### Lazy loading
`MainPage` i tot el seu sub-arbre (Firestore inclòs) es carreguen de forma lazy. El chunk inicial només conté `Home` (login) i la inicialització d'Auth, cosa que millora el temps de primera càrrega.

---

## CI/CD

Dos workflows a `.github/workflows/`:

**`ci.yml` — PR Validation**
S'executa en cada PR contra `master`. Fa lint, typecheck i build. És el gate de qualitat abans de fusionar.

**`firebase-deploy.yml` — Deploy**
S'executa en cada push a `master`. Fa build (amb les variables d'entorn secretes) i desplega a Firebase Hosting via `firebase-tools`.

Les credencials (claus Firebase, service account) viuen com a **GitHub Secrets** i mai s'inclouen al repositori.

---

## Desenvolupament local

```bash
# Instal·lar dependències
npm install

# Arrancar en mode dev (hot reload)
npm run dev

# Typecheck
npm run type-check

# Lint
npm run lint

# Build de producció
npm run build
```

> Les variables d'entorn de Firebase per a dev local es poden posar a un fitxer `.env.local` (no commitejat). En producció les injecta el workflow de GitHub Actions.

---

## Deploy manual

```bash
# Build
npm run build

# Deploy (requereix firebase-tools i autenticació)
npx firebase-tools deploy --only hosting --project tool-fma-c8f4b
```
