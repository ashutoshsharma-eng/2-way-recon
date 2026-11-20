import { useEffect, useState } from "react";
import type { NavItem } from "@quantumphinance/kraft-component";
import { Squares2X2Icon } from "@heroicons/react/24/outline";
import { APP } from "../config";

/**
 * QP sidebar (matches the SheetKraft / Related Party reference app).
 * Hand-rolled because kraft-component's <Navigation> renders its own white panel and user footer
 * that can't be themed to this look. It reads the same NAV items from src/config.ts.
 */

const itemBase =
  "flex w-full items-center gap-2.5 rounded-md px-1 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-qp-blue/10 dark:text-gray-300";
const itemOn = "bg-qp-navon font-bold text-gray-900 hover:bg-qp-navon dark:text-gray-50";

/** Small green box with − / + used as the expand toggle for groups. */
function GroupToggle({ open }: { open: boolean }) {
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] border-qp-green text-[11px] font-semibold leading-none text-qp-green">
      {open ? "−" : "+"}
    </span>
  );
}

function Badge({ value }: { value: string | number }) {
  return (
    <span className="ml-auto rounded-full bg-qp-blue px-[7px] py-px text-[11px] font-semibold text-white dark:text-gray-950">
      {value}
    </span>
  );
}

function Item({ item, activeId, onSelect, depth, openGroups }: { item: NavItem; activeId: string; onSelect: (id: string) => void; depth: number; openGroups?: string[] }) {
  const hasKids = !!item.children?.length;
  const childActive = hasKids && item.children!.some((c) => activeId === c.id || activeId.startsWith(c.id + "/"));
  const [open, setOpen] = useState(!openGroups || openGroups.includes(item.id) || childActive);
  useEffect(() => { if (childActive) setOpen(true); }, [childActive]);
  const active = activeId === item.id;

  if (hasKids)
    return (
      <li>
        <button type="button" className={`${itemBase} ${childActive && !open ? itemOn : ""}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <GroupToggle open={open} />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge !== undefined && <Badge value={item.badge} />}
        </button>
        {open && (
          <ul className="ml-[7px] border-l-[1.5px] border-qp-green pl-3.5">
            {item.children!.map((c) => (
              <Item key={c.id} item={c} activeId={activeId} onSelect={onSelect} depth={depth + 1} openGroups={openGroups} />
            ))}
          </ul>
        )}
      </li>
    );

  return (
    <li>
      <button type="button" className={`${itemBase} ${active ? itemOn : ""}`} aria-current={active ? "page" : undefined} onClick={() => onSelect(item.id)}>
        {item.icon && <span className="flex shrink-0 items-center text-qp-green">{item.icon}</span>}
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge !== undefined && <Badge value={item.badge} />}
      </button>
    </li>
  );
}

export function SideNav({ items, activeId, onSelect, onSwitchModule, openGroups }: {
  items: NavItem[]; activeId: string; onSelect: (id: string) => void; onSwitchModule?: () => void;
  /** Group ids expanded initially (default: all). Groups containing the active page always open. */
  openGroups?: string[];
}) {
  return (
    <aside className="flex h-full w-[250px] shrink-0 flex-col overflow-y-auto bg-qp-side px-4 py-3">
      {/* Logo card + version */}
      <div className="rounded-[10px] bg-qp-surface px-3.5 py-2.5">
        <img src={APP.logo} alt={APP.product} className="mx-auto block h-auto w-[150px] max-w-full dark:hidden" />
        <img src={APP.logoDark} alt={APP.product} className="mx-auto hidden h-auto w-[150px] max-w-full dark:block" />
      </div>

      {/* Module name + Switch Module */}
      <div className="mb-0.5 mt-4 flex items-center gap-3">
        <Squares2X2Icon className="h-5 w-5 text-qp-ink" />
        <span className="text-xl font-medium text-qp-ink">{APP.module}</span>
      </div>
      <button type="button" onClick={onSwitchModule} className="mb-3.5 ml-9 self-start text-[13px] text-qp-blue hover:underline">
        Switch Module
      </button>

      <nav aria-label="Main">
        <ul className="flex flex-col gap-0.5">
          {items.map((it) => (
            <Item key={it.id} item={it} activeId={activeId} onSelect={onSelect} depth={0} openGroups={openGroups} />
          ))}
        </ul>
      </nav>
    </aside>
  );
}
