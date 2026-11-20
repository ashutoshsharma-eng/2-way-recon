# Quantum Phinance App Design System (v1.0)

The design system = **kraft-component** (library) + **QP theme** (tokens in `src/index.css`) + **App kit** (`src/layout`, `src/ui`).
A live, interactive copy of everything below is the **Design System** page in the running app (`#/design-system`).

## 1. Principles
1. **Uniform** — a user moving between two apps must not notice a different product. Chrome is fixed; only content changes.
2. **Token-only colour** — every colour comes from `qp-*` tokens or the remapped brand `blue`. Light and dark both work.
3. **Dense, calm, readable** — 14px body, 13px tables, pale-blue cards on white, one primary action per group.
4. **Accessible** — real `<label>`s, `aria-invalid` + inline error text, visible blue focus ring, keyboard-operable menus/dialogs, 4.5:1 text contrast.
5. **Mock-first** — no backend; seeded demo data persisted in `localStorage`; "Reset Demo Data" restores it.

## 2. Layers and where code lives
| Layer | Path | Who edits |
|---|---|---|
| Tokens, theme, Tailwind config | `src/index.css`, `tailwind.config.js` | Platform team only |
| App frame (sidebar, header, footer) | `src/layout/AppShell.tsx`, `SideNav.tsx` | Platform team only |
| Page chrome + content blocks | `src/layout/PageHeader.tsx` (`PageHeader`, `PageTitleBar`, `Card`, `StatCard`, `DataTable`, `BarRow`), `TriggerLabel.tsx` | Platform team only |
| UI kit | `src/ui/index.tsx` (fields, `Modal`, `Drawer`, `Tbl`, `TabBar`, `Steps`, `StatusChip`, `Pill`, `KV`, `Banner`, `FileDrop`), `src/ui/charts.tsx` | Platform team only |
| App identity, roles, nav, status colours | `src/config.ts` | **App team** |
| Business logic + data | `src/features/*.tsx` | **App team** |
| Screens | `src/pages/*.tsx`, routes in `src/App.tsx` | **App team** |

## 3. Tokens
See the table in `CLAUDE.md`. Usage: surfaces `bg-qp-card` / `bg-qp-surface`, text `text-qp-ink` / `text-qp-mut`, borders `border-qp-line` (dividers) and `border-qp-field` (inputs),
accent `text-qp-blue`, semantic edges `qp-green` (success) `qp-amber` (warning) `qp-red` (danger) `qp-purple` (in-progress).
Status chip tones: `blue amber purple orange slate green red`. Conventional mapping: Draft=slate · Pending=amber · In review=purple · Sent back=orange · Approved=green · Rejected=red.

## 4. Components
### kraft-component (import from `@quantumphinance/kraft-component`)
| Need | Component | Key props |
|---|---|---|
| Action | `Button` | `variant` solid\|outline\|text · `color` primary\|danger\|success\|gray · `size` xs\|sm\|md\|lg · `startIcon` `endIcon` `isDisabled` `onPress` |
| Searchable select / multi | `AutoComplete` | `items[{id,name,group?}]` `multiSelect` `onSelectionChange` |
| Date range | `DateRangePicker_` `DateTimeRange` | `displayFormat` `disableFutureDates` |
| Files | `FilePicker` `MultiFilePicker` `DropZone` | `accept[]` `maxFiles` `maxSizeMB` |
| Tags | `Chip` `ChipGroup` `ChipInput` | `label` `color` `variant` |
| Toggle | `Switch` `ToggleButtonGroup` | `label` `isSelected` |
| Tabs | `Tabs` | `tabs[{id,label,content}]` `variant` line\|pill |
| Menu | `Menu` | `trigger` (non-button!) `items[{id,label,danger,separator}]` `onAction` |
| Modal (trigger-only) | `Dialog` | `trigger` (non-button!) `title` `variant` default\|danger `onConfirm` |
| Progress | `Progress` `StepProgress` `CircularProgress` `ProgressDialog` | `value` `steps` `currentStep` |
| Hint | `Tooltip` | `content` `placement` |
| Toasts | `ToastProvider` + `useToast()` | `.success/.error/.warning/.info(title, message?)` |
| Charts | `ChartPreview` | fullscreen wrapper |
| Class tokens | `labelCls` `helperCls` `errorCls` `inputCls` | for custom controls |

### App kit (import from `../ui`, `../layout/PageHeader`)
| Need | Component |
|---|---|
| Text / number / email | `TextInput` (`upper`, `maxLength`, `readOnly`) |
| Dropdown | `SelectInput` (`options: string[] \| [value,label][]`, `blank`) |
| Date | `DateInput` · Textarea `TextArea` · Check `CheckboxInput` · Custom `Field` wrapper |
| File drop | `FileDrop` (`accept`, `label`) |
| Table | `Tbl` + `Tr` + `Td` (hand-built rows) or `DataTable<T>` (columns config) |
| Tabs with counts | `TabBar` |
| Status | `StatusChip` + `STATUS_TONE`; free-form `Pill` |
| Stepper | `Steps` |
| Overlays | `Modal` (controlled, actions may return `false` to stay open) · `Drawer` |
| Callout | `Banner` (`info` \| `warn`) · key-value `KV` · section `SectionTitle` |
| KPI / blocks | `StatCard` (`tone`) · `Card` · `BarRow` |
| Charts | `Donut` · `HBars` · `Columns` (colours are `text-*` classes) |
| Trigger content | `TriggerLabel` (`primary\|outline\|outline-gray\|outline-danger\|icon\|pill`) |
| Helpers | `lib/format` (`fmt`, `fmtDT`, `inr`, `pct`) · `lib/files` (`downloadCsv`, `downloadXlsx`, `readSheet`, `parseCsv`) · `lib/storage` (`usePersistentState`) · `lib/app` (`useApp`: role, `notify`) |

## 5. Page anatomy
```
┌ Sidebar ┬ Header: [☰] [search………] 🔑 ☾ 🔔 [User · Role ▾] ┐
│ logo    ├ Title bar: ← Title ⟳ ☆ ⤢            status  actions  View Logs › ┤
│ Module  │ (rule)                                                          │
│ nav…    │ Cards (bg-qp-card, rounded-lg, px-6 py-5, gap-5)                │
│         ├ Footer: Product version            Module Module · Stage        ┤
```
Content max: grids use `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5`; KPI row `repeat(auto-fit,minmax(170px,1fr))`; chart row `minmax(300px,1fr)`.

## 6. Patterns
- **Maker–checker:** Maker creates (Draft → Pending) · Checker approves / sends back / rejects (remarks mandatory except approve) · approvals update the master data ·
  every step logged to `history` and `notify()`d. Reference: `features/records.tsx` + `RecordDetail.tsx`.
- **Validation:** on submit; each field gets `error`; toast summary; clear error on edit.
- **Empty state:** `Tbl empty="No records match."`. **Loading:** none (mock data is synchronous).
- **Destructive:** Modal with danger button; text says what is lost and that it cannot be undone.
- **Export:** CSV (`downloadCsv`) and Excel (`downloadXlsx`) with the same headers as the screen.
- **Import:** template download → upload → row-level validation table → import only when zero errors.
- **Audit trail:** "View Logs" in the title bar opens a `Drawer` with When / By / Action / Remarks.

## 7. Do / Don't
| Do | Don't |
|---|---|
| `bg-qp-card text-qp-mut border-qp-line` | `bg-[#f3f7fc]`, `text-gray-500` with no dark pair |
| `<Menu trigger={<TriggerLabel tone="icon">…</TriggerLabel>}>` | `<Menu trigger={<Button>…</Button>}>` |
| `toast.success("Saved", id)` | `alert("Saved")` |
| One `PageHeader`/`PageTitleBar` per page | Custom `<h1>` + own back button |
| `inr(amount)` right-aligned | `amount.toFixed(2)` left-aligned |
| Add a status to `STATUS_TONE` | `className="bg-green-200"` on a chip |
| Ask the platform team for a missing component | Copy `layout/` or `ui/` into your feature and tweak |

## 8. Change process
Shared files (`layout/`, `ui/`, `index.css`, `tailwind.config.js`) change **only in the template repo** via PR by the platform team, then apps pull the update:
```bash
git remote add template https://github.com/abhishek-sharma-qp/kraft-app-template.git   # once
git fetch template && git merge template/main --allow-unrelated-histories   # to take design-system updates
```
