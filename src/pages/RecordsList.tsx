/* RECIPE: List page = PageHeader(primary action) -> Card -> search + tabs by status -> table with status chip + row Menu. */
import { useState } from "react";
import { Menu, useToast } from "@quantumphinance/kraft-component";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { Button } from "@quantumphinance/kraft-component";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { STATUS_TONE } from "../config";
import { useRecords } from "../features/records";
import { Card, PageHeader } from "../layout/PageHeader";
import { TriggerLabel } from "../layout/TriggerLabel";
import { fmt, inr } from "../lib/format";
import { Modal, StatusChip, TabBar, Tbl, Td, Tr, TextInput } from "../ui";

const OPEN = ["Draft", "Pending", "In Review", "Sent Back"];

export default function RecordsList() {
  const { recs, remove } = useRecords();
  const nav = useNavigate();
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [delId, setDelId] = useState<string | null>(null);
  const tab = sp.get("tab") ?? "all";

  const tabs = [
    { id: "all", label: "All", count: recs.length },
    { id: "open", label: "Open", count: recs.filter((r) => OPEN.includes(r.status)).length },
    { id: "closed", label: "Closed", count: recs.filter((r) => !OPEN.includes(r.status)).length },
  ];
  const rows = recs
    .filter((r) => (tab === "open" ? OPEN.includes(r.status) : tab === "closed" ? !OPEN.includes(r.status) : true))
    .filter((r) => !q || `${r.id} ${r.name} ${r.category}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <PageHeader title="All Records" actions={<Button size="lg" onPress={() => nav("/records/new")}>New Record</Button>} />
      <Card>
        <div className="mb-3.5 max-w-sm">
          <TextInput label="" value={q} onChange={setQ} placeholder="Filter by reference, name or category" />
        </div>
        <TabBar tabs={tabs} active={tab} onChange={(id) => setSp((p) => { p.set("tab", id); return p; })} />
        <Tbl heads={["Ref. no.", "Name", "Category", "Amount (₹)", "Date", "Status", ""]} empty="No records match.">
          {rows.map((r) => (
            <Tr key={r.id} onClick={() => nav(`/records/${r.id}`)}>
              <Td nowrap><Link to={`/records/${r.id}`} className="font-semibold">{r.id}</Link></Td>
              <Td>{r.name}</Td>
              <Td>{r.category}</Td>
              <Td right>{inr(r.amount)}</Td>
              <Td nowrap>{fmt(r.date)}</Td>
              <Td><StatusChip status={r.status} tones={STATUS_TONE} /></Td>
              <Td>
                {/* stopPropagation: row click must not fire when the menu is used */}
                <span onClick={(e) => e.stopPropagation()}>
                  <Menu
                    placement="bottom end"
                    trigger={<TriggerLabel tone="icon"><EllipsisVerticalIcon className="h-5 w-5" /></TriggerLabel>}
                    items={[{ id: "view", label: "View" }, { id: "delete", label: "Delete", danger: true }]}
                    onAction={(id) => (id === "view" ? nav(`/records/${r.id}`) : setDelId(r.id))}
                  />
                </span>
              </Td>
            </Tr>
          ))}
        </Tbl>
      </Card>
      <Modal open={!!delId} title="Delete record?" onClose={() => setDelId(null)} actions={[
        { label: "Cancel", kind: "outline" },
        { label: "Delete", kind: "danger", onClick: () => { remove(delId!); toast.success("Record deleted", delId!); } },
      ]}>
        <p>{delId} will be permanently removed. This cannot be undone.</p>
      </Modal>
    </>
  );
}
