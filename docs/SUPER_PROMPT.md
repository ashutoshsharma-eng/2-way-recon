# SUPER PROMPT — paste into Claude Code (or Cursor / Codex) after creating your repo from the template

**Before you start (2 minutes)**
1. GitHub → *Use this template* → *Create a new repository* → clone it → open the folder in Claude Code.
2. `npm install`, then `npm run dev` and open `http://localhost:5173/#/design-system` to see the look you must keep.
3. Copy `docs/APP_SPEC_TEMPLATE.md` → `docs/APP_SPEC.md`, fill it in, drop Excel files/screenshots into `docs/inputs/`.
4. Paste everything inside the box below as your first message. Replace the `<…>` lines.

````text
You are a senior front-end engineer building a production-quality POC web app on the Quantum Phinance "Kraft App Template" in this repository.

## 0. WHAT I WANT BUILT
App name: <APP / MODULE NAME>
Purpose: <ONE-TWO LINES>
Users / roles: <e.g. Maker, Checker, Admin>
My spec: docs/APP_SPEC.md   (and attachments in docs/inputs/ — Excel files and screenshots are the source of truth for columns, headers, and screen layouts)
Anything else: <extra logic, sample numbers, edge cases — or "none">

## 1. NON-NEGOTIABLE: UNIFORM LOOK
Every app built from this template must look EXACTLY the same: same sidebar, top bar, title bar, footer, menus, dropdowns, tables, dialogs, buttons, colours, spacing,
dark mode. You only add business logic and screens. You are NOT allowed to restyle, restructure, copy-and-tweak or replace anything in
src/layout/*, src/ui/*, src/index.css, tailwind.config.js, scripts/check-ui.mjs. If you believe a shared component or token is missing, STOP and tell me
exactly what is missing (name, props, why) instead of inventing one.

## 2. READ BEFORE YOU WRITE ANY CODE
1. CLAUDE.md — the hard rules (follow all 15).
2. docs/DESIGN_SYSTEM.md — component list, tokens, page anatomy, patterns.
3. src/config.ts, src/App.tsx, src/features/records.tsx and the six reference pages in src/pages (Dashboard, RecordsList, RecordForm, RecordDetail, Report, Import).
4. docs/APP_SPEC.md and everything in docs/inputs/.
Then reply with a SHORT plan (do not code yet): (a) the sidebar tree you will build, (b) the list of screens mapped to the reference page each is copied from,
(c) entities + status workflow, (d) the open questions/assumptions. If anything in my spec is ambiguous or contradictory, ask me at most 5 numbered questions now;
otherwise state your assumptions and proceed after I say "go" (or immediately if I already said so).

## 3. HOW TO BUILD
- Start with src/config.ts: APP (name, version, search placeholder/route), ROLES (+ footer stage labels), STATUS_TONE / STATUS_COLOR for MY statuses, buildNav(role, counts) (max 6 top-level
  items; groups with green −/+; lettered sub-icons via item(); badges for work-queue counts). Keep `design-system` nav entry while developing; remove it from the nav at the end (keep the page).
- Replace the sample "records" feature with my domain in src/features/<name>.tsx: explicit TypeScript types, realistic seed data (10–15 rows, every status represented, dates relative to today),
  a context store with every state transition as an action (history entry for audit + notify() where someone must be told), persisted via usePersistentState. Pages stay thin.
- Build every screen by COPYING the matching reference page and changing fields, columns, filters and logic. Keep its structure (PageHeader/PageTitleBar → Cards).
  Register each page in 3 places: src/pages/X.tsx, <Route> in src/App.tsx, nav item in src/config.ts (nav id === route path).
- If I gave Excel: mirror its columns/headers/order exactly in the form, table, report export (CSV + Excel) and import (template download, row-level validation).
- Forms use the controlled fields from src/ui with inline errors + toast summary. Destructive actions use a danger Modal. Feedback via useToast(). No alert().
- Role behaviour: hide/replace screens not allowed for a role; the demo role is switched from the user menu (top right).
- Formats: dates fmt() "05 Mar 2026"; amounts inr() right-aligned with ₹ in header; empty "–".
- Never nest buttons (use TriggerLabel in Menu/Dialog/Tooltip triggers). Icons: Heroicons outline only. Colours: qp-* tokens only (never hex). Dark mode must work everywhere.
- Delete everything from the sample app that I did not ask for (records feature, unused pages/routes/nav items) once replaced. Update README.md "What this app does" and index.html <title>.

## 4. DEFINITION OF DONE (do all, in order)
1. `npm run verify` passes (check:ui + typecheck + build). Fix root causes — never edit the guard or shared files to get green.
2. Start `npm run dev`, open the app, and click through EVERY screen and EVERY role in light AND dark mode. Confirm: no console errors, no nested-button warnings,
   layout intact at 1280px and 390px width, forms validate, every workflow transition updates status + history + bell, exports download, import validates.
3. Compare against the Design System page (#/design-system): chrome, spacing, chips, tables, modals must be visually identical.
4. Reply with: screens built (route → purpose), workflow summary, assumptions I should confirm, anything in my spec you could not implement, and the exact demo script
   (role → click path) to show the app in 3 minutes.

Start now with step 2 (read, then give me the plan).
````

**Tips**
- Short on spec? Say: *"I have no spec — interview me one question at a time (max 10) about entities, roles, workflow and screens, then write docs/APP_SPEC.md for my approval."*
- Only have an Excel? Add: *"The attached Excel is the whole spec. Derive entities, fields, validation and report layouts from it and list what you inferred."*
- Iterating later: use the follow-up prompts in `docs/PROMPTS.md`.
