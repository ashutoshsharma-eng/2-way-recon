/* Living style guide. Every component an app may use, rendered once. If a thing isn't here, don't invent it — ask the platform team. */
import { useState } from "react";
import { Button, Chip, Dialog, Menu, Progress, StepProgress, Switch, Tabs, useToast } from "@quantumphinance/kraft-component";
import { EllipsisVerticalIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Card, DataTable, PageHeader, StatCard } from "../layout/PageHeader";
import { TriggerLabel } from "../layout/TriggerLabel";
import { Banner, CheckboxInput, DateInput, Drawer, FileDrop, KV, Modal, Pill, SectionTitle, SelectInput, StatusChip, TabBar, TextArea, TextInput } from "../ui";
import type { Tone } from "../ui";
import { Columns, Donut, HBars } from "../ui/charts";
import { STATUS_TONE } from "../config";

const TOKENS: [string, string][] = [
  ["qp-page", "bg-qp-page"], ["qp-side", "bg-qp-side"], ["qp-surface", "bg-qp-surface"], ["qp-card", "bg-qp-card"], ["qp-hover", "bg-qp-hover"],
  ["qp-navon", "bg-qp-navon"], ["qp-search", "bg-qp-search"], ["qp-line", "bg-qp-line"], ["qp-field", "bg-qp-field"], ["qp-blue", "bg-qp-blue"],
  ["qp-green", "bg-qp-green"], ["qp-amber", "bg-qp-amber"], ["qp-red", "bg-qp-red"], ["qp-purple", "bg-qp-purple"],
];
const TONES: Tone[] = ["blue", "amber", "purple", "orange", "slate", "green", "red"];

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card title={title} className="mb-4">{children}</Card>;
}

export default function DesignSystem() {
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [tab, setTab] = useState("a");
  const [files, setFiles] = useState<string[]>([]);
  const [v, setV] = useState("");

  return (
    <>
      <PageHeader title="Design System" description="Uniform across every app. Import components; never restyle them. Rules: CLAUDE.md · Reference: docs/DESIGN_SYSTEM.md" />

      <Sec title="Colour tokens (theme-aware — toggle dark mode in the header)">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
          {TOKENS.map(([n, c]) => (
            <div key={n} className="text-xs text-qp-ink"><div className={`mb-1 h-10 rounded-md border border-qp-line ${c}`} />{n}</div>
          ))}
        </div>
      </Sec>

      <Sec title="Typography">
        <div className="text-[22px] font-medium text-qp-ink">Page title 22px / medium</div>
        <div className="text-base font-semibold text-qp-ink">Card title 16px / semibold</div>
        <div className="text-sm text-qp-ink">Body 14px</div>
        <div className="text-[13px] text-qp-ink">Table and field text 13px</div>
        <div className="text-xs text-qp-mut">Helper text 12px muted</div>
      </Sec>

      <Sec title="Buttons (page level = size lg)">
        <div className="flex flex-wrap gap-2.5">
          <Button size="lg">Primary</Button>
          <Button size="lg" variant="outline">Outline</Button>
          <Button size="lg" variant="outline" color="danger">Danger outline</Button>
          <Button size="lg" color="danger">Danger</Button>
          <Button size="lg" startIcon={<PlusIcon className="h-4 w-4" />}>With icon</Button>
          <Button size="lg" isDisabled>Disabled</Button>
          <Button size="sm" variant="outline">Small (tables only)</Button>
        </div>
      </Sec>

      <Sec title="Form fields (controlled — from ui/)">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <TextInput label="Text" value={v} onChange={setV} placeholder="Type here" help="Helper text" />
          <TextInput label="With error" value="" error="This field is required" required />
          <TextInput label="Read-only" value="Locked" readOnly />
          <SelectInput label="Select" value="" onChange={() => {}} options={["One", "Two"]} />
          <DateInput label="Date" value="" onChange={() => {}} />
          <TextArea label="Textarea" value="" onChange={() => {}} />
          <CheckboxInput checked label="Checkbox" onChange={() => {}} />
          <Switch label="Switch (kraft)" />
        </div>
        <FileDrop files={files} onChange={setFiles} />
      </Sec>

      <Sec title="Status chips, pills, banners">
        <div className="mb-3 flex flex-wrap gap-2">{Object.keys(STATUS_TONE).map((s) => <StatusChip key={s} status={s} tones={STATUS_TONE} />)}</div>
        <div className="mb-3 flex flex-wrap gap-2">{TONES.map((t) => <Pill key={t} tone={t}>{t}</Pill>)}<Chip color="blue" label="Chip (kraft)" /></div>
        <div className="grid gap-3 md:grid-cols-2"><Banner tone="info">Info banner</Banner><Banner tone="warn">Warning banner</Banner></div>
      </Sec>

      <Sec title="KPI tiles">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3.5">
          <StatCard value={12} label="Blue" /><StatCard value={4} label="Amber" tone="amber" /><StatCard value={7} label="Purple" tone="purple" />
          <StatCard value={21} label="Green" tone="green" /><StatCard value={2} label="Red" tone="red" hint="with hint" />
        </div>
      </Sec>

      <Sec title="Tables, tabs, key-value">
        <TabBar tabs={[{ id: "a", label: "All", count: 3 }, { id: "b", label: "Open", count: 1 }]} active={tab} onChange={setTab} />
        <DataTable columns={[{ key: "name", header: "Name" }, { key: "amt", header: "Amount", align: "right" }]} rows={[{ id: 1, name: "Row one", amt: "1,000.00" }, { id: 2, name: "Row two", amt: "2,500.00" }]} />
        <SectionTitle>Key-value</SectionTitle>
        <KV rows={[["Label", "Value"], ["Another", "Value two"]]} />
        <SectionTitle>Library tabs</SectionTitle>
        <Tabs variant="line" tabs={[{ id: "x", label: "First", content: <p className="py-3 text-sm text-qp-ink">First panel</p> }, { id: "y", label: "Second", content: <p className="py-3 text-sm text-qp-ink">Second panel</p> }]} />
      </Sec>

      <Sec title="Overlays & feedback">
        <div className="flex flex-wrap gap-2.5">
          <Button size="lg" variant="outline" onPress={() => setModal(true)}>Open modal</Button>
          <Button size="lg" variant="outline" onPress={() => setDrawer(true)}>Open drawer</Button>
          <Button size="lg" variant="outline" onPress={() => toast.success("Saved", "Success toast")}>Success toast</Button>
          <Button size="lg" variant="outline" onPress={() => toast.error("Failed", "Error toast")}>Error toast</Button>
          <Menu trigger={<TriggerLabel tone="outline">Menu <EllipsisVerticalIcon className="h-4 w-4" /></TriggerLabel>} items={[{ id: "a", label: "Action" }, { id: "d", label: "Delete", danger: true }]} onAction={(id) => toast.info("Menu", id)} />
          <Dialog trigger={<TriggerLabel tone="outline-danger">Library danger dialog</TriggerLabel>} title="Delete?" description="Trigger-only dialog from kraft-component." variant="danger" onConfirm={() => toast.success("Deleted")}><span /></Dialog>
        </div>
        <p className="mt-2 text-xs text-qp-mut">Triggers for Dialog / Menu / Tooltip use TriggerLabel, never Button (no nested buttons).</p>
      </Sec>

      <Sec title="Progress & charts">
        <div className="mb-4 max-w-md"><Progress value={65} showValue /></div>
        <div className="mb-4 max-w-xl"><StepProgress steps={["Initiated", "In review", "Approved"]} currentStep={1} /></div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5">
          <Donut label="Demo" items={[{ label: "A", value: 5, color: "text-qp-blue" }, { label: "B", value: 3, color: "text-qp-green" }, { label: "C", value: 2, color: "text-qp-amber" }]} />
          <HBars items={[{ label: "Alpha", value: 8, color: "text-qp-blue" }, { label: "Beta", value: 4, color: "text-qp-blue" }]} />
          <Columns labels={["Jan", "Feb", "Mar"]} series={[{ name: "Items", color: "text-qp-blue", values: [3, 6, 4] }]} />
        </div>
      </Sec>

      <Modal open={modal} title="Controlled modal" onClose={() => setModal(false)} actions={[{ label: "Cancel", kind: "outline" }, { label: "Confirm", kind: "solid" }]}>
        <p>Use Modal when it must open after validation or from code. Actions returning false keep it open.</p>
      </Modal>
      <Drawer open={drawer} title="Drawer" onClose={() => setDrawer(false)}><p className="text-sm text-qp-ink">Side panel for audit trails, filters and secondary detail.</p></Drawer>
    </>
  );
}
