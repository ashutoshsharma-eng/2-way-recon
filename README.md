# 2-Way Recon

Front-end-only **two-way data reconciliation** for Quantum Phinance, built on the [kraft-app-template](https://github.com/abhishek-sharma-qp/kraft-app-template)
(React 19 · kraft-component · Tailwind · Heroicons · Vite). Upload two files, map keys and comparison columns, normalise formats, and get every
row classified with a human-readable `Mismatch_Reason` — **100% in the browser**: files never leave the machine.

```bash
npm install
npm run dev           # http://localhost:5173  → Home → "Load Sample Data"
npm run test:engine   # reconciliation engine tests (Node, no framework)
npm run verify        # design-system guard + typecheck + build
```

## Workflow
| Step | Screen | What happens |
|---|---|---|
| 1 | **Upload Datasets** (`#/recon/upload`) | Dataset A (source/left) + Dataset B (target/right): `.xlsx` `.xls` `.csv` `.txt`. Delimiter auto-detect or pick comma / tab / pipe / semicolon; sheet picker (largest sheet by default); header-row toggle; preview of first 8 rows with row/column counts. |
| 2 | **Map & Transform** (`#/recon/map`) | Key columns (one or more → composite key) and comparison columns. Per pair: data type (Text / Number / Date) and per-side rules for A and B, with a live raw → normalised preview. Auto-map by column-name similarity. Save / load mapping templates (`.json`). |
| 3 | **Results & Export** (`#/recon/results`) | KPI cards, status donut, mismatches by field, status tabs (All · Matched · Field Mismatch · Missing in B · Missing in A · Duplicates), search by key or reason, side-by-side A/B values with mismatched cells highlighted, row detail drawer, export. |

### Normalisation rules
- **Text:** trim + collapse spaces · ignore case (UPPER / lower) or case-sensitive · strip special characters · strip leading zeros.
- **Number:** text cast to number (`"012345"` = `12345`) · strip ₹ $ € £ / INR / Rs and thousands separators (Indian or western grouping) · `(1,200)` and `1200-` read as negatives · decimal rounding · numeric tolerance (e.g. ±0.01).
- **Date:** input format DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD (any separator), YYYYMMDD, Excel serial, or auto-detect; month names (`15-Mar-2026`) and trailing times understood; normalised to ISO `YYYY-MM-DD`. Real Excel date cells are read as dates.

### Result buckets
| Status | Rule | Mismatch_Reason |
|---|---|---|
| Matched | key in both, every comparison column equal after normalisation | – |
| Field Mismatch | key in both, ≥1 comparison column differs | `Pin Code mismatch (File A: 400059 vs File B: 400082); Amount mismatch (File A: ₹1,500.00 vs File B: 1450, diff -50)` |
| Missing in B | key only in Dataset A (or blank key in A) | `Key [1024] missing in Dataset B` |
| Missing in A | key only in Dataset B (or blank key in B) | `Key [2001] missing in Dataset A` |
| Duplicate Key | key occurs more than once in A or B — every row with that key is flagged and excluded from matching | `Duplicate key [1031]: 1× in Dataset A, 2× in Dataset B — excluded from matching` |

### Export
Full report, current view (tab + search) or exceptions only, as **.xlsx** (Summary · Detail · Mapping sheets, autofilter), **.csv**, or **.txt** with
tab / pipe / semicolon / comma / custom delimiter. Always includes `Status`, `Key`, `Mismatch_Reason`, source row numbers and mapped A/B values
(+ per-field `_Result`); optionally every original column of both files.

### Privacy & persistence
Parsing (SheetJS, PapaParse) and matching (Web Worker) run locally. The working session (files, parsed rows, last result) is kept in this browser's
IndexedDB so a reload doesn't lose work; mapping, templates and the activity log are in localStorage. **Reset Session** (sidebar) clears it.
Performance: the engine reconciles 100k × 100k rows in well under a second (see `npm run test:engine`).

## Code map
| Path | What |
|---|---|
| `src/features/recon-engine.ts` | Pure engine: normalisation, key building, matching, reasons, summary, auto-map heuristics (no React/DOM — runs in the worker and in Node tests) |
| `src/features/recon.worker.ts` | Web Worker wrapper around the engine |
| `src/features/recon-io.ts` | File parsing, export (.xlsx/.csv/.txt), mapping-template read/write |
| `src/features/recon.tsx` | Context store: datasets, mapping, run, result, templates, activity log, IndexedDB session |
| `src/features/recon-sample.ts` | "Load Sample Data" files + ready-made mapping |
| `src/pages/` | `Home`, `Upload`, `Mapping`, `Results`, `Templates` |
| `scripts/test-engine.mjs` | Engine tests incl. the sample reconciliation and a 100k-row performance check |
| `docs/APP_SPEC.md` | App spec |

---

_The rest of this README is the template's own documentation._

## Start a new app
1. Click **Use this template → Create a new repository**.
2. `git clone <your repo> && cd <your repo> && npm install && npm run dev` → http://localhost:5173
3. Open **#/design-system** to see every component.
4. Fill `docs/APP_SPEC.md` (copy of `docs/APP_SPEC_TEMPLATE.md`) and drop Excel/screenshots in `docs/inputs/`.
5. Paste the prompt from **[docs/SUPER_PROMPT.md](docs/SUPER_PROMPT.md)** into Claude Code (or Cursor / Codex).

## What is in the box
| Path | What |
|---|---|
| `CLAUDE.md` / `AGENTS.md` | Rules AI tools read automatically (15 hard rules, tokens, recipes) |
| `docs/DESIGN_SYSTEM.md` | Design system reference (tokens, components, anatomy, patterns) |
| `docs/SUPER_PROMPT.md` | The prompt every team pastes to build their app |
| `docs/APP_SPEC_TEMPLATE.md` | Fill-in spec: roles, entities, workflow, screens, Excel contracts |
| `docs/PROMPTS.md` | Follow-up prompts (add screen, status, review…) |
| `src/layout/` `src/ui/` `src/index.css` | **Locked** design system (platform team only) |
| `src/config.ts` | **Start here**: app name, roles, nav, status colours |
| `src/features/` `src/pages/` | Your logic and screens (sample "records" app = reference recipes) |
| `scripts/check-ui.mjs` | Guard: rejects hex colours, nested buttons, alert(), other UI libs, pages without a title bar, nav/route drift |

## Commands
```bash
npm run dev       # dev server
npm run verify    # check:ui + typecheck + build  (run before every commit; CI runs it too)
```

## Getting design-system updates into an app
```bash
git remote add template https://github.com/abhishek-sharma-qp/kraft-app-template.git
git fetch template && git merge template/main --allow-unrelated-histories
```
Only `src/layout`, `src/ui`, `src/index.css`, `tailwind.config.js`, `scripts/`, `CLAUDE.md`, `docs/DESIGN_SYSTEM.md` should change in such a merge — resolve conflicts in favour of the template there.

## Maintainers (platform team)
Design-system changes happen only in this repo: update the component/token, the **Design System** page, `docs/DESIGN_SYSTEM.md`, and bump the version in `CHANGELOG.md`.

## What this app does
See the top of this file.
