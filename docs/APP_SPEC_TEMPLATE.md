# APP SPEC — copy this file to `docs/APP_SPEC.md` and fill it in

Fill what you know; write `TBD` for the rest (the AI will list assumptions). Attach Excel files / screenshots to the repo under `docs/inputs/`
and reference them below. Keep it factual — logic, not styling (styling is fixed by the design system).

## 1. Identity
- Product / module name (sidebar title): 
- One-line purpose: 
- Footer product + version: 
- Users and roles (name → what they do → which screens): 

| Role | Stage label (footer) | Can do |
|---|---|---|
| | | |

## 2. Business logic
- Entities (what a "record" is) and their fields — type, required?, allowed values, validation, default:

| Entity | Field | Type (text/number/date/select/file) | Required | Rules / allowed values |
|---|---|---|---|---|
| | | | | |

- Workflow / statuses and transitions (who moves it from → to, what is mandatory, what email/notification fires):

| From | Action | By role | To | Mandatory input | Notification |
|---|---|---|---|---|---|
| | | | | | |

- Calculations / formulas (write them exactly, with an example):
- Business rules and edge cases (e.g. "self details need no relative"):
- Master data / dropdown lists (values + where they come from):

## 3. Screens
For each screen: name · route · role(s) · what it shows · filters · columns · buttons · what each button does. A sketch, screenshot or Excel mock is fine.

| # | Screen | Type (home / list / form / detail / report / import) | Roles | Sidebar group |
|---|---|---|---|---|
| 1 | | | | |

### Screen 1 — <name>
- Purpose: 
- Fields / columns (in order, header text exactly):
- Filters / search: 
- Actions: 
- Validation / messages: 
- Excel / screenshot reference: `docs/inputs/…`

## 4. Excel / data contracts
- **Import** files (columns in order, header text, types, validation) — attach sample: 
- **Export / report** files (columns, totals, grouping): 
- Sample data to seed (10–15 realistic rows incl. every status): 

## 5. Dashboards / KPIs
List each tile and chart: label · how it is calculated · click-through target.

## 6. Notifications / emails (optional)
Trigger · recipient role · subject · body fields.

## 7. Out of scope / assumptions
