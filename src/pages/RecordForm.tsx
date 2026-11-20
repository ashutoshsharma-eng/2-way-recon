/* RECIPE: Form page = PageTitleBar(status chip) -> Card with Steps -> Card with 3-col field grid -> Clear (outline) + Submit (solid), left-aligned, size lg.
   Uses the CONTROLLED fields from ../ui so validation + dependent fields work. */
import { useState } from "react";
import { Button, useToast } from "@quantumphinance/kraft-component";
import { useNavigate } from "react-router-dom";
import { STATUS_TONE } from "../config";
import { CATEGORIES, useRecords } from "../features/records";
import { Card, PageTitleBar } from "../layout/PageHeader";
import { today } from "../lib/format";
import { DateInput, FileDrop, SelectInput, Steps, StatusChip, TextArea, TextInput } from "../ui";

const blank = { name: "", category: "", amount: "", date: today(), notes: "" };

export default function RecordForm() {
  const { add } = useRecords();
  const nav = useNavigate();
  const toast = useToast();
  const [f, setF] = useState(blank);
  const [files, setFiles] = useState<string[]>([]);
  const [err, setErr] = useState<Partial<Record<keyof typeof blank, string>>>({});
  const set = (k: keyof typeof blank) => (v: string) => { setF((p) => ({ ...p, [k]: v })); setErr((e) => ({ ...e, [k]: undefined })); };

  const submit = (final: boolean) => {
    const e: typeof err = {};
    if (!f.name.trim()) e.name = "Name is required";
    if (!f.category) e.category = "Select a category";
    if (!(Number(f.amount) > 0)) e.amount = "Enter an amount greater than 0";
    if (!f.date) e.date = "Date is required";
    setErr(e);
    if (Object.keys(e).length) return toast.error("Fix the highlighted fields");
    const r = add({ name: f.name.trim(), category: f.category, amount: Number(f.amount), date: f.date, notes: f.notes, files }, final);
    toast.success(final ? "Record submitted" : "Draft saved", r.id);
    nav(`/records/${r.id}`);
  };

  return (
    <>
      <PageTitleBar title="New Record" status={<StatusChip status="Draft" tones={STATUS_TONE} />} />
      <Card className="mb-4"><Steps names={["Initiated", "In review", "Approved"]} current={0} /></Card>
      <Card title="Record details">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <TextInput label="Name" required value={f.name} onChange={set("name")} error={err.name} />
          <SelectInput label="Category" required value={f.category} onChange={set("category")} options={[...CATEGORIES]} error={err.category} />
          <TextInput label="Amount (₹)" required value={f.amount} onChange={(v) => set("amount")(v.replace(/[^\d.]/g, ""))} error={err.amount} help="Numbers only" />
          <DateInput label="Date" required value={f.date} onChange={set("date")} error={err.date} />
          <TextArea className="md:col-span-2 xl:col-span-2" label="Notes" value={f.notes} onChange={set("notes")} />
        </div>
        <FileDrop files={files} onChange={setFiles} />
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button size="lg" variant="outline" onPress={() => { setF(blank); setFiles([]); setErr({}); }}>Clear</Button>
          <Button size="lg" variant="outline" onPress={() => submit(false)}>Save Draft</Button>
          <Button size="lg" onPress={() => submit(true)}>Submit</Button>
        </div>
      </Card>
    </>
  );
}
