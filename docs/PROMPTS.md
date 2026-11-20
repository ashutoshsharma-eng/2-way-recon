# Follow-up prompts (after the SUPER_PROMPT build)

Always end with: *"Run `npm run verify` and fix everything."*

## Spec interview (no spec yet)
```
I have no written spec. Interview me one question at a time (max 10) about entities, roles, workflow and screens. Then write docs/APP_SPEC.md
using docs/APP_SPEC_TEMPLATE.md and wait for my approval before coding.
```

## From Excel only
```
docs/inputs/<file>.xlsx is the whole spec. Read every sheet. Derive entities, fields (type/required/allowed values), validation, reports and screens.
Write docs/APP_SPEC.md with a clear "Inferred" section for anything you guessed, then ask me to confirm before building.
```

## Add a screen
```
Add screen "<Name>" at route <x/y> under sidebar group "<Group>" for roles <…>. Copy <RecordsList|RecordForm|RecordDetail|Report|Import|Dashboard>.
Fields/columns: <…>. Rules: <…>. Register in App.tsx and config.ts. No new styling.
```

## Add a workflow step / status
```
Add status "<X>" (tone <…>) between <A> and <B>: who moves it, mandatory remarks, notification. Update STATUS_TONE/STATUS_COLOR, the store action with history + notify,
the Steps names on the form/detail pages, tabs and dashboard tiles.
```

## Replicate a screen from a screenshot
```
Rebuild the attached screenshot with the shell's components. Where it uses something not in docs/DESIGN_SYSTEM.md, do NOT hand-roll — list the gap at the end.
```

## Seed richer demo data
```
Expand seed data to 25 realistic rows covering every status, 3 months of dates, edge cases from the spec. Keep it in features/<name>.tsx.
```

## Review / polish pass
```
Audit src/ against CLAUDE.md: nested buttons, missing dark pairs, hex colours, pages without PageHeader, unregistered routes, missing labels/aria, console warnings.
Fix, then run npm run verify and click through both themes at 1280px and 390px.
```

## Request a missing shared component (for the platform team)
```
List components this app needed that the template lacks. For each: name, proposed props, where it was needed, a usage snippet — formatted as a GitHub issue.
```
