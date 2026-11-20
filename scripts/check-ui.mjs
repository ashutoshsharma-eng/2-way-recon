#!/usr/bin/env node
/* Design-system guard. Run: npm run check:ui  (also runs in CI and inside `npm run verify`).
   Fails the build when an app drifts from the uniform QP look. Keep rules cheap and obvious. */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(join(root, "src")).filter((f) => /\.(tsx?|css)$/.test(f));
const rel = (f) => relative(root, f).replaceAll("\\", "/");

/** Files that ARE the design system: they may define colours / raw chrome. */
const SYSTEM = [/^src\/index\.css$/, /^src\/layout\//, /^src\/ui\//, /^src\/pages\/DesignSystem\.tsx$/];
const isSystem = (r) => SYSTEM.some((re) => re.test(r));

const problems = [];
const add = (f, line, msg) => problems.push(`${rel(f)}${line ? ":" + line : ""}  ${msg}`);

for (const f of files) {
  const r = rel(f);
  const src = readFileSync(f, "utf8");
  const lines = src.split("\n");
  lines.forEach((ln, i) => {
    const n = i + 1;
    if (/^\s*(\/\/|\/\*|\*)/.test(ln)) return;
    if (!isSystem(r)) {
      if (/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/.test(ln) && !/href=|&#|\\#/.test(ln)) add(f, n, "hard-coded hex colour: use qp-* tokens");
      if (/\bstyle=\{\{[^}]*(color|background|border)/i.test(ln)) add(f, n, "inline colour style: use qp-* token classes");
      if (/\brgb\(|\bhsl\(/.test(ln) && !/var\(--qp/.test(ln)) add(f, n, "raw rgb()/hsl() colour: use qp-* tokens");
    }
    if (/\b(alert|confirm|prompt)\(/.test(ln) && !/toast|\.confirm\(/.test(ln)) add(f, n, "alert()/confirm(): use useToast() or Modal");
    if (/trigger=\{\s*<Button\b/.test(ln)) add(f, n, "<Button> inside trigger= nests buttons: use <TriggerLabel>");
    if (/from\s+["']@mui|from\s+["']antd|from\s+["']@chakra|from\s+["']react-bootstrap|from\s+["']@radix-ui|from\s+["']@headlessui/.test(ln)) add(f, n, "other UI library: use kraft-component + src/ui");
    if (/@heroicons\/react\/(20|16)\//.test(ln) || /from\s+["']lucide-react|from\s+["']react-icons|@fortawesome/.test(ln)) add(f, n, "icons: use @heroicons/react/24/outline only");
    if (!isSystem(r) && /\b(bg|text|border)-(gray|slate|zinc|neutral|stone|red|green|amber|orange|violet|purple|rose|emerald)-\d{2,3}\b/.test(ln) && !/dark:/.test(ln)) {
      add(f, n, "palette colour without dark: pair: use qp-* token (or add dark: variant)");
    }
  });
  if (/^src\/pages\//.test(r) && r !== "src/pages/NotFound.tsx" && r !== "src/pages/DesignSystem.tsx" || /^src\/pages\/DesignSystem/.test(r)) {
    if (!/PageHeader|PageTitleBar/.test(src)) add(f, 0, "page must render <PageHeader/> or <PageTitleBar/>");
  }
}

// package.json: forbid competing UI/CSS stacks
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
for (const d of deps) if (/^(@mui\/|antd$|@chakra-ui\/|bootstrap$|react-bootstrap$|styled-components$|@emotion\/|lucide-react$|react-icons$)/.test(d)) problems.push(`package.json  forbidden dependency "${d}" (design system is kraft-component + Tailwind + Heroicons)`);
if (!deps.includes("@quantumphinance/kraft-component")) problems.push("package.json  @quantumphinance/kraft-component missing");

// routes <-> nav consistency is checked loosely: every nav id (except reset/group ids) should appear as a route path.
try {
  const cfg = readFileSync(join(root, "src/config.ts"), "utf8");
  const app = readFileSync(join(root, "src/App.tsx"), "utf8");
  const ids = [...cfg.matchAll(/\bitem\(\s*"([^"]+)"/g)].map((m) => m[1]).concat([...cfg.matchAll(/\bid:\s*"([a-z][a-z0-9/-]*)"/g)].map((m) => m[1]));
  for (const id of new Set(ids)) {
    if (["reset", "rec", "rep", "adm"].includes(id) || /^(req|mst)$/.test(id)) continue;
    if (!app.includes(`path="${id}"`) && !app.includes(`path="${id}/`)) problems.push(`src/config.ts  nav id "${id}" has no <Route path="${id}"> in src/App.tsx`);
  }
} catch { /* optional */ }

if (problems.length) {
  console.error(`\nDesign-system check FAILED (${problems.length}):\n`);
  for (const p of problems) console.error("  ✗ " + p);
  console.error("\nSee CLAUDE.md and docs/DESIGN_SYSTEM.md. Fix the code — do not edit this script or the design-system files to silence it.\n");
  process.exit(1);
}
console.log("Design-system check passed.");
