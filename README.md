# Kraft App Template

Reusable starting point for every Quantum Phinance app. Same sidebar, top bar, menus, dropdowns, tables, dialogs, colours and dark mode in every app —
built on **@quantumphinance/kraft-component** + the QP theme. Teams supply the logic and screens (or an Excel mock); AI/engineers add them without touching the chrome.

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
_(replace this section with a short description of the app you build)_
