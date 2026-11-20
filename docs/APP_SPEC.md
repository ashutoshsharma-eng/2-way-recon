# APP SPEC — 2-Way Recon

## 1. Identity
- Module name (sidebar title): **2-Way Recon**
- One-line purpose: reconcile any two tabular files (Dataset A = source/left, Dataset B = target/right) entirely in the browser and explain every difference.
- Footer: SheetKraft 1.0.0 · "2-Way Recon Module · Reconciliation"
- Roles: single role **Recon Analyst** (no approval workflow).

## 2. Business logic
- **Entities:** Dataset (file name, headers, rows, parse options), ColumnPair (A column, B column, type, rules A, rules B, decimals, tolerance, label),
  ReconConfig (keys[], compares[]), ResultRow (status, key, row A, row B, mismatched pairs, Mismatch_Reason), Mapping Template (.json).
- **Statuses:** Matched · Field Mismatch · Missing in B · Missing in A · Duplicate Key (see README for exact rules and reason texts).
- **Key:** each key pair is normalised per its rules; parts joined with ` | ` (composite keys). Blank keys are never matched.
- **Duplicates:** a key that occurs more than once on either side → every row with that key (both sides) is `Duplicate Key` and excluded from matching.
- **Comparison:** numbers equal when `|A − B| ≤ tolerance` after optional rounding; dates compared as ISO; text compared after its rules. Values that
  cannot be read as the chosen type are shown as `value [invalid number|date]` in the reason.
- **Exact match %** = Matched ÷ total rows in Dataset A.
- **Audit:** loads, runs, exports and template actions are logged (Home → Activity log, Results → View Logs); a run completion posts to the bell.

## 3. Screens
| # | Screen | Route | Type |
|---|---|---|---|
| 1 | Home | `dashboard` | home |
| 2 | Upload Datasets | `recon/upload` | import |
| 3 | Map & Transform | `recon/map` | form |
| 4 | Results & Export | `recon/results` | report |
| 5 | Mapping Templates | `templates` | list |

## 4. Data contracts
- **Inputs:** `.xlsx` / `.xls` (any sheet), `.csv`, `.txt` (comma, tab, pipe, semicolon; auto-detected). First row = headers (toggle). ≤ 100 MB per file.
- **Export:** `Status, Key, Mismatch_Reason, Row_A, Row_B, A: <key col>, B: <key col>…, A: <col>, B: <col>, <label>_Result…` (+ optional `A.<col>` / `B.<col>`
  for every source column). Excel adds Summary and Mapping sheets.
- **Template JSON:** `{ app: "2-way-recon", kind: "mapping-template", version: 1, id, name, savedAt, headersA[], headersB[], config: { version: 1, keys[], compares[] } }`.

## Known limits / assumptions
- Decimal-comma numbers (`1.234,56`) are not supported — export such files with a decimal point or map them as Text.
- Matching is 1:1 on unique keys; many-to-many matching is deliberately not attempted (duplicates are surfaced instead).
