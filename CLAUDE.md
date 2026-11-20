# Kraft App Template — rules for AI assistants

Every app built from this template must look and behave **identically** to every other Quantum Phinance app: same sidebar,
top bar, title bar, menus, dropdowns, tables, dialogs, colours, spacing. Your job is to add **business logic and screens**, never
to restyle the chrome.

Stack: React 19 · react-aria-components · Tailwind 3 · Heroicons · Vite · HashRouter · **@quantumphinance/kraft-component**.
No backend: data is mock/seed data persisted in `localStorage`.

## Read first, every session
1. This file. 2. `docs/DESIGN_SYSTEM.md` (components, anatomy, recipes). 3. `docs/APP_SPEC.md` (the app you are building — if it is
missing, ask the user for it or create it from `docs/APP_SPEC_TEMPLATE.md`). 4. Open the running app at `#/design-system`.

## Hard rules (enforced by `npm run check:ui`)
1. **Use kraft-component and `src/ui` first.** Only hand-roll when neither has it, using the tokens below. Never add another UI/CSS/icon library.
2. **Never nest buttons.** `Dialog`, `Menu`, `Tooltip`, `ProgressDialog` wrap their `trigger` in a `<button>`: pass `<TriggerLabel tone="…">`, never `<Button>`.
3. **Every page** starts with `<PageHeader/>` (lists, dashboards) or `<PageTitleBar/>` (forms, details) from `src/layout/PageHeader.tsx`,
   followed by `<Card>`s. No custom page chrome, no second title.
4. **Add a page in 3 places:** `src/pages/X.tsx` → `<Route path="x/y">` in `src/App.tsx` → nav item in `src/config.ts`
   (nav `id` MUST equal the route path without leading slash). Detail routes map to their parent in `activeNavFor`.
5. **Dark mode is mandatory.** Use theme-aware `qp-*` tokens (no `dark:` needed). Any other colour class needs a `dark:` pair. Never hard-code hex/rgb.
6. **Icons:** `@heroicons/react/24/outline` only; `w-4 h-4` in nav/buttons, `h-5 w-5` in header/toolbars.
7. **Buttons:** page-level `<Button size="lg">`; `size="sm"` only inside dense tables. One solid (primary) per action group, others `variant="outline"`.
   Order: Clear/Cancel (outline) then Submit (solid), left-aligned. Destructive = `color="danger"`.
8. **Forms:** use the controlled fields from `src/ui` (`TextInput`, `SelectInput`, `DateInput`, `TextArea`, `CheckboxInput`, `FileDrop`) with inline `error`
   text; required fields marked `required`. Validate on submit, `toast.error("Fix the highlighted fields")`.
9. **Feedback:** `useToast()` for success/error. Destructive/irreversible actions need a `Modal` (danger) confirm. Never `alert()`/`confirm()`.
10. **Dropdowns / selects:** `SelectInput` (or kraft `AutoComplete` for searchable). Row/overflow actions: kraft `Menu` with `TriggerLabel tone="icon"`.
11. **Status:** map statuses once in `src/config.ts` (`STATUS_TONE`, `STATUS_COLOR`) and render `<StatusChip/>`. Never colour a status ad hoc.
12. **Formats:** dates `fmt()` → `05 Mar 2026`; amounts `inr()` (Indian grouping) right-aligned with `₹` in the header; `–` for empty.
13. **Domain code lives in `src/features/<name>.tsx`** (types, seed, context store, actions). Every state-changing action appends to `history`
    (audit trail) and calls `notify()` when someone must be told. Pages stay thin. Replace the sample `records` feature; do not leave it behind.
14. **Do not edit** `src/layout/*`, `src/ui/*`, `src/index.css`, `tailwind.config.js`, `scripts/check-ui.mjs` or `node_modules`. Need a new shared
    component or token? Stop and tell the user (it goes to the platform team) — do not fork it into your app.
15. Before finishing run **`npm run verify`** (check:ui + typecheck + build). Fix failures; never silence the guard.

## Tokens (CSS variables in `src/index.css`, light + dark; use as `bg-qp-card`, `text-qp-mut`, `border-qp-line`, `bg-qp-blue/10` …)
Brand blue **#2E75B6** (Tailwind `blue` is remapped to it, so kraft buttons/chips/focus are on-brand). Font **Inter**, body 14px.

| Token | Use | Light |
|---|---|---|
| `qp-page` | app background | `#ffffff` |
| `qp-side` | sidebar | `#e6f0f9` |
| `qp-surface` | logo card, table body, menus, modals | `#ffffff` |
| `qp-card` | content cards, KPI tiles | `#f3f7fc` |
| `qp-hover` | hover on cards / rows / icon buttons | `#eaf2fa` |
| `qp-navon` | active sidebar item | `#d3e4f5` |
| `qp-search` | header search, back button | `#f3f4f6` |
| `qp-ink` / `qp-mut` | primary / muted text | `#1f2937` / `#5b6672` |
| `qp-line` | dividers, title-bar rule, table borders | `#c9d6e4` |
| `qp-field` | input borders | `#9fb6cf` |
| `qp-blue` / `qp-bluetext` | links, accents / text on pale chips | `#2e75b6` / `#1f5a94` |
| `qp-green` | sidebar tree + letter boxes, success | `#2f9e7c` |
| `qp-amber` `qp-red` `qp-purple` | warning / danger / in-progress | `#d99a1d` `#c0392b` `#7a5cc2` |

Sizes: body `text-sm`; table/field text `text-[13px]`; helper `text-xs`; card title `text-base font-semibold`; page title `text-[22px] font-medium`;
field label = kraft `labelCls` (11px uppercase). Radius `rounded-md` controls, `rounded-lg` cards. Inputs `h-9`. Card padding `px-6 py-5`, grid gaps `gap-5`.
In light mode `src/index.css` remaps `border-gray-200` → `qp-field` and `text-gray-400` → `qp-mut` — keep those lines.

## The app frame (fixed — do not change)
Sidebar 250px (`qp-side`): white logo card + version · module name + "Switch Module" · nav with green −/+ groups, green lettered sub-icons, blue count pills ·
active item `qp-navon` + bold. Header: grey search pill, key, theme toggle, bell, user pill "Name · Role ▾" (role switch). Footer: "<Product> <version>" left,
"<Module> Module · <Stage>" right. All driven by `APP`, `ROLES`, `buildNav` in `src/config.ts` — **that file is where you start**.

## Page recipes (copy the reference page, then change fields/columns/logic)
| Need | Copy | Shape |
|---|---|---|
| Home / KPIs | `pages/Dashboard.tsx` | PageHeader · quick actions · `StatCard`s · chart cards |
| List / queue | `pages/RecordsList.tsx` | PageHeader(primary action) · Card · filter · `TabBar` · `Tbl` · row `Menu` |
| Create / edit form | `pages/RecordForm.tsx` | PageTitleBar(status) · `Steps` card · 3-col field grid · Clear + Submit |
| Detail + approval | `pages/RecordDetail.tsx` | PageTitleBar(status, View Logs) · 2/3 + 1/3 · decision `Modal` · audit `Drawer` |
| Report + export | `pages/Report.tsx` | PageHeader(Export CSV/Excel) · filter Card · table + totals |
| Excel/CSV upload | `pages/Import.tsx` | template download · parse · row-level validation · import |

Excel input from the user = the column contract: mirror its columns in the form/table/import/export in the same order and header text.

## Known library quirks (kraft-component 1.1.x)
- `Dialog` is trigger-only (no `isOpen`); `Tabs` labels are plain strings (no count badge) → use `src/ui` `Modal` / `TabBar` when you need those.
- `Navigation` can't be themed to the QP sidebar → the shell uses `SideNav`. No data grid exported → use `Tbl`/`DataTable`.
- `Button` has no submit type: wire forms via `onPress`. `FormField` is uncontrolled (read with `FormData`); prefer the controlled `src/ui` fields.
- Tailwind must scan the library: keep the `node_modules/@quantumphinance/kraft-component/dist` glob in `tailwind.config.js`.
