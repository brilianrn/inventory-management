<div align="center">

<img src="public/logo-amb.png" alt="amb" width="220" />

# Inventory Management

**Four connected inventory apps for a multi-outlet F&B business, built as one Next.js codebase.**

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2023-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-2-764ABC?logo=redux&logoColor=white)](https://redux-toolkit.js.org)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-Radix-000000?logo=shadcnui&logoColor=white)](https://ui.shadcn.com)
[![Architecture](https://img.shields.io/badge/Architecture-Hexagonal-2E8B57)](#architecture)

<!-- TODO: replace the "#" below with the deployed URL once the demo is hosted -->
### [→ Open the live demo](#) &nbsp;·&nbsp; [Architecture](#architecture) &nbsp;·&nbsp; [Try the demo panel](#trying-the-demo)

</div>

---

## About the project

Restaurant and café chains lose money in three quiet places: stock that was never counted properly, stock that got thrown away without a record, and deliveries that arrived but were never checked in. **amb** is an operations system that closes all three, across every outlet in the chain.

It is made of **four applications that share one source of truth**:

| Application | Who uses it | What it does |
|---|---|---|
| **Inventory Admin** | Head-office staff | The back office. Reviews and validates stock-count documents, monitors waste records, and owns the configuration that controls what the three field apps are allowed to do. |
| **Stock Take** | Schedulers, support staff, outlet crew | Schedules physical stock counts per outlet, manages crew accounts, and gives crew a mobile screen to count stock against a two-hour session. |
| **Stock Waste** | Outlet crew | Records products thrown away — category, quantity, and photo evidence — and files one document per category. |
| **Receiving** | Head office and outlet crew | Tracks delivery orders to each outlet, and lets crew accept or reject a delivery with photo proof before a daily cut-off. |

The four are genuinely wired together rather than merely sitting side by side. A schedule created in the back office decides what crew count tonight. What crew count appears in the back office for approval. Configuration set by head office decides which products crew may record as waste and how much. **Waste reduces outlet stock, a confirmed delivery increases it, and both movements are visible from the back office.**

---

## Disclaimer

This is an **independent reconstruction built for portfolio purposes**. It was rebuilt from scratch from a written functional specification — **no source code was copied from any system**. Every brand, outlet, product, supplier, and user name in it is **fictional and generated for this demo**. The application is **not connected to any production system**, and no company is named as its origin.

---

## Screenshots

> Screenshots are being captured. Until they land, here is what each one will show.

**Desktop — back office**

- **Stock take list** — filter panel open, free-text search, export and bulk validation
- **Document detail** — live variance against the ±5% tolerance, with out-of-tolerance rows flagged
- **User access & permissions** — the two permission tabs and the Restricted attribute
- **Delivery orders** — permission-gated actions; export only enables once a filter returns rows

**Mobile — outlet crew**

- **Counting sheet** — brand chips coloured by completeness, above a two-hour countdown
- **Waste categories** — the picker, showing how many products each category already holds
- **Waste product card** — quantity capped by the UoM limit configured in the back office
- **Receiving crew** — delivery orders for one outlet and the countdown to the 22:30 cut-off

**The demo control panel** — persona switch, per-permission checkboxes, and the time and connection simulations

<!--
  Drop the files into docs/screenshots/ using the names below, then replace this
  whole section with the markup that follows.

  Desktop @ 1440x900
    desktop-01-stocktake-list.png    /stocktake                  filter panel open
    desktop-02-stocktake-detail.png  /stocktake/<id>             variance highlighting
    desktop-03-user-access.png       /usersetting/<id>           Restricted attribute expanded
    desktop-04-receiving-desk.png    /ops/receiving/desk         filter active, export enabled
    desktop-05-demo-panel.png        any page, demo panel open

  Mobile @ 390x844
    mobile-01-counting-sheet.png     /ops/stocktake/crew/form    mid-session, chips part-filled
    mobile-02-waste-categories.png   /ops/stockwaste/crew        after one category is filled
    mobile-03-waste-product.png      /ops/stockwaste/crew/<cat>  product card with the limit line
    mobile-04-receiving-crew.png     /ops/receiving/crew         outlet picked, countdown running

### Desktop — back office

| Stock take list | Document detail |
|:--:|:--:|
| <img src="docs/screenshots/desktop-01-stocktake-list.png" alt="Stock take list" width="100%"> | <img src="docs/screenshots/desktop-02-stocktake-detail.png" alt="Stock take detail" width="100%"> |
| Filter panel, search, export and bulk validation | Live variance against the ±5% tolerance |

| User access & permissions | Delivery orders |
|:--:|:--:|
| <img src="docs/screenshots/desktop-03-user-access.png" alt="User access" width="100%"> | <img src="docs/screenshots/desktop-04-receiving-desk.png" alt="Receiving desk" width="100%"> |
| Two permission tabs and the Restricted attribute | Permission-gated actions, export needs a filter |

### Mobile — outlet crew

<table>
  <tr>
    <td align="center" width="25%"><img src="docs/screenshots/mobile-01-counting-sheet.png" alt="Counting sheet" width="100%"></td>
    <td align="center" width="25%"><img src="docs/screenshots/mobile-02-waste-categories.png" alt="Waste categories" width="100%"></td>
    <td align="center" width="25%"><img src="docs/screenshots/mobile-03-waste-product.png" alt="Waste product card" width="100%"></td>
    <td align="center" width="25%"><img src="docs/screenshots/mobile-04-receiving-crew.png" alt="Receiving crew" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><sub>Counting sheet — brand chips and a two-hour countdown</sub></td>
    <td align="center"><sub>Waste categories with filled counts</sub></td>
    <td align="center"><sub>Quantity capped by the configured UoM limit</sub></td>
    <td align="center"><sub>Delivery orders and the 22:30 cut-off</sub></td>
  </tr>
</table>

### The demo control panel

<img src="docs/screenshots/desktop-05-demo-panel.png" alt="Demo control panel" width="420">
-->

---

## Key features

### Access control — the part I would point at first

- **Permissions, not named roles.** A user does not carry a role label. They carry a *list of permissions*, and any combination is legal — including combinations nobody thought to name. Twenty-six permissions, granted individually.
- **A permission can carry an attribute.** The *Validate Stock Take* permission has a `Restricted` / `Not Restricted` setting. Restricted holders may edit and validate only until **12:00**; after that the buttons disappear — and the refusal is enforced in the use-case layer too, so bypassing the UI gets you nothing.
- **Layered sidebar filtering.** A submenu whose view permission you lack is not rendered. A parent group whose children are all filtered away disappears with them. Two people with different permissions see sidebars of different lengths.
- **Element-level hiding.** It goes past menus: table action columns vanish entirely rather than being disabled, module cards disappear from the entry page, and route guards block direct URL entry.
- **Module entry resolves per user.** A module card links to the first page *that particular user* can actually open, so crew-only accounts never land on a back-office page they would be bounced out of.

### Inventory Admin (back office)

- Stock-take document list with a three-column filter panel (date range, outlet, status), free-text search, CSV export, and bulk validation.
- Document detail computing variance live against a ±5% tolerance, flagging out-of-tolerance rows — including the "system says zero but crew counted something" case — without blocking anything.
- Waste and return-waste documents in two tabs, each with its own independent filter state.
- Configuration screens that drive the field apps: stock-take schedules, waste categories and per-product assignment, per-UoM quantity ceilings, and return destinations per brand.
- User access management: create users (who start with **zero** permissions), then grant permissions across two tabs with a save button that appears **only once something actually changed**.

### Stock Take

- Scheduler with conflict detection — a second schedule on the same outlet, day and hour is refused, and the message names the schedule it clashes with.
- Crew counting sheet with brand chips that change colour by completeness, per-category accordions, a **two-hour session countdown**, product-code and empty-only toggles, and search.
- **Offline-tolerant drafts.** Counts are written to browser storage as they are typed, survive a reload mid-session, and are cleared automatically when the day rolls over so nobody continues yesterday's count.
- Auto-submit when the session expires, for schedules flagged that way.

### Stock Waste

- Category picker, then one card per product: a searchable product list limited to the products configured for *that* category, quantity capped by the **per-UoM ceiling set in the back office**, conditional expiry date, and mandatory photo evidence (max 10, resized in the browser).
- Save writes only to the local draft and returns to the picker; submitting sends everything at once and creates **one document per non-empty category**.
- A 13:00–23:00 filing window, with an out-of-hours message when it is closed.

### Receiving

- Delivery-order list with status labels, attention markers, and permission-gated Refresh / Import / Export / Validate. Export stays disabled until a filter is active and returns rows.
- Branching validation: *Accept* asks for a note (preset list plus free text) and **increases stock at the destination**; *Cancel* asks for a reason and leaves stock untouched. Either one locks the document permanently — enforced in the adapter, not just the button.
- Crew mobile screen with a **countdown to the 22:30 daily cut-off**, and an accept-with-photo-evidence flow.

### Cross-cutting

- **Connection handling** — a red banner on crew screens when the connection drops, a green one when it returns, and a blocking dialog in the back office.
- **Filter state lives globally**, so returning from a detail page restores the filters *and* the pagination position you left behind.
- **A framework-free test suite** (`npm run check`) asserting the business rules directly against the domain layer — 77 checks, no test runner, no mocks.

---

## Trying the demo

The demo runs entirely in your browser. There is no login: a floating **Demo Panel** button sits in the bottom-right corner of every page and stands in for the session that would normally come from signing in.

**Switch persona.** Five ready-made combinations — *Admin Penuh* (everything), *Validator Restricted*, *Staff Konfigurasi*, *Viewer Saja*, and *Outlet Crew*. Picking one swaps the whole permission list at once.

**Toggle individual permissions.** Every permission has its own checkbox, grouped exactly as it is on the user-access screen. Changes apply instantly, with no page reload.

**Simulate the 12:00 rule.** One switch pretends the clock is past the cut-off, so you can watch the Restricted attribute take effect at any time of day.

**Simulate the waste window and a dropped connection.** A three-way control forces the 13:00–23:00 waste window open or closed, and a switch cuts the connection to show the offline banners.

### Scenarios worth trying

1. **Watch a permission disappear.** On a stock-take document, turn off *Validate Stock Take* in the panel — the Validate button vanishes immediately, without a reload.
2. **Watch the clock enforce a rule.** Set *Validate Stock Take* to **Restricted**, then flip the "past 12:00" switch. The edit and validate buttons disappear. Turn Restricted off and they come back.
3. **Watch the sidebar shrink.** Turn off every permission in the *Configuration* group — the whole Configuration parent menu disappears, not just its children.
4. **Watch the apps talk to each other.** Open the waste form as outlet crew, file a product, then open *Waste* in Inventory Admin: the document is at the top of the list with the crew's real photo attached, and that outlet's stock on the dashboard has gone down by exactly what was recorded.
5. **Watch stock come back.** Accept a delivery order in Receiving, then check the same product on the dashboard — it has increased by the delivered quantity.
6. **Lose the connection mid-count.** Start a counting session, type some numbers, cut the connection from the panel, then restore it. The counts survive.

---

## Architecture

The project follows a **Hexagonal (ports and adapters)** layout. Each business context is a self-contained package whose layers are not allowed to reach past each other.

```
src/packages/<context>/
├── domain/         Entities and business rules. Pure JavaScript — no React,
│                   no Redux, no network. This is where the rules actually live.
├── port/           Contracts. repository.port (driven) and usecase.port (driving).
├── usecase/        Orchestration. Receives a repository through its constructor.
├── repository/     Data adapters. Currently in-memory, backed by a seeded dataset.
└── presentation/   Hooks and components for this context.
```

Three contexts: **`access`** (permissions, navigation, user accounts), **`catalog`** (master data and configuration), and **`documents`** (stock take, waste, delivery orders).

**Dependencies run one way:**

```
presentation  →  usecase  →  port  ←  repository
```

The domain imports nothing from outside itself. That is the whole point of the split: the rules that matter — variance tolerance, the 12:00 cut-off, per-UoM ceilings, the two-hour session, stock movement — can be tested by running plain Node against them, with no browser and no test framework. That is exactly what `npm run check` does.

**Swapping the data layer.** Every wire meets in one file, `src/shared/config/di.js`:

```js
const createRepositories = () => {
  const seed = getSeed();
  return {
    access:    new InMemoryAccessRepository(seed),
    catalog:   new InMemoryCatalogRepository(seed),
    documents: new InMemoryDocumentRepository(seed),
  };
};
```

Moving to a real backend means writing three classes that extend the same ports and changing those three lines. **Domain, use cases, and every component stay untouched**, because none of them knows anything but the port contract.

The in-memory adapter is a deliberate choice for a demo — it makes the whole system explorable from a static host, with no server to run and no database to seed. The seed itself is deterministic (a seeded PRNG), so server and client render identically and the data is stable between sessions.

---

## Tech stack

| Technology | Why |
|---|---|
| **Next.js 16 (App Router)** | Route groups let four applications live in one codebase while keeping separate layouts, shells, and route guards per app. |
| **React 19** | The current baseline; the project is written against the React Compiler's rules — no state writes in effect bodies, no refs read during render. |
| **JavaScript (not TypeScript)** | A deliberate constraint of this build. Contracts are expressed as abstract port classes and JSDoc rather than types, which keeps the ports explicit and readable. |
| **Tailwind CSS 4** | CSS-first configuration via `@theme`, with a small set of semantic design tokens so light and dark themes share one source of truth. |
| **shadcn/ui + Radix** | Accessible, unstyled primitives copied into the repo rather than installed as a black box — so dialog, select, and table behaviour can be corrected where needed. |
| **Redux Toolkit + redux-persist** | Filter state and the demo permission set must survive navigation between list and detail pages; persistence keeps them across reloads. |
| **lucide-react** | Icon set, wrapped behind a single `<Icon name="…" />` component so the icon library is swappable in one file. |
| **sonner** | Toast notifications for lightweight confirmations. |

---

## Running locally

**Requirements:** Node.js 20 or newer.

```bash
git clone https://github.com/brilianrn/inventory-management.git
cd inventory-management

npm install
npm run dev          # http://localhost:4018
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server on port 4018 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint, including the React Compiler rules |
| `npm run check` | Business-rule self-check — 77 assertions against the domain layer, no framework |

There is no environment file and no database. Open `/` and pick a module.

---

## Project structure

```
.
├── public/
│   └── logo-amb.png              Wordmark used by the sidebar and entry page
├── scripts/
│   └── check-domain.mjs          Framework-free business-rule assertions
└── src/
    ├── app/                      Next.js App Router
    │   ├── page.js               Entry page: module picker + project overview
    │   ├── icon.png              Favicon and touch icon
    │   ├── (inventory-admin)/    Back office: documents, configuration, users
    │   ├── (stocktake)/          Scheduling, crew accounts, mobile counting
    │   ├── (stockwaste)/         Mobile waste filing
    │   └── (receiving)/          Delivery orders: back office and crew
    ├── packages/                 Business contexts (hexagonal)
    │   ├── access/               Permissions, navigation, user accounts
    │   ├── catalog/              Master data and configuration
    │   └── documents/            Stock take, waste, delivery orders
    ├── components/ui/            shadcn/ui primitives, vendored
    ├── shared/
    │   ├── config/di.js          The single dependency-injection swap point
    │   ├── lib/                  Draft storage, CSV export, photo resizing, filters
    │   ├── store/                Redux slices: demo, filters, connection, UI
    │   └── ui/                   Application-level components and page shells
    └── seed/                     Deterministic fictional dataset
        ├── master.js             Brands, outlets, products, suppliers, configuration
        ├── documents.js          60 days of operational history
        ├── stock.js              The running per-outlet stock ledger
        └── users.js              Demo users and their permission combinations
```

---

<div align="center">

Built by **[brilianrn](https://github.com/brilianrn)** · All data in this demo is fictional

</div>
