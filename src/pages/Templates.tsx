/* Mapping templates: save the current mapping + transformation rules, import / download .json files, apply to the loaded files. */
import { useState } from "react";
import { Button, Menu, useToast } from "@quantumphinance/kraft-component";
import { ArrowUpTrayIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useRecon } from "../features/recon";
import { downloadTemplate, readTemplate } from "../features/recon-io";
import type { MappingTemplate } from "../features/recon-io";
import { FileButton } from "../features/recon-ui";
import { Card, PageHeader } from "../layout/PageHeader";
import { TriggerLabel } from "../layout/TriggerLabel";
import { fmtDT } from "../lib/format";
import { Banner, Modal, Tbl, Td, TextInput, Tr } from "../ui";

export default function Templates() {
  const r = useRecon();
  const nav = useNavigate();
  const toast = useToast();
  const [del, setDel] = useState<MappingTemplate | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");

  const apply = (t: MappingTemplate) => {
    const miss = r.applyTemplate(t);
    if (!r.a || !r.b) toast.info("Template applied", "Upload both datasets to use it");
    else if (miss.length) toast.warning(`Applied "${t.name}" with gaps`, `Not in current files: ${miss.join(", ")}`);
    else toast.success("Template applied", t.name);
    nav(r.a && r.b ? "/recon/map" : "/recon/upload");
  };

  return (
    <>
      <PageHeader title="Mapping Templates" description="Reusable column mappings and transformation rules for recurring reconciliations. Stored in this browser and portable as .json files." actions={<>
        <FileButton label="Import .json" accept=".json,application/json" icon={<ArrowUpTrayIcon className="h-4 w-4" />} onFile={async (f) => {
          try { const t = await readTemplate(f); r.addTemplate(t); toast.success("Template imported", t.name); } catch (e) { toast.error("Could not import template", (e as Error).message); }
        }} />
        <Button size="lg" isDisabled={!r.cfg.keys.length} onPress={() => { setName(""); setErr(""); setSaveOpen(true); }}>Save Current Mapping</Button>
      </>} />
      {!r.cfg.keys.length && <Banner tone="info" className="mb-4">Map at least one key column on <b>Map &amp; Transform</b> to save it as a template.</Banner>}
      <Card title={`${r.templates.length} template(s)`}>
        <Tbl heads={["Name", "Key columns", "Comparison columns", "Saved", ""]} empty="No templates yet — save one from Map & Transform or import a .json file.">
          {r.templates.map((t) => (
            <Tr key={t.id} onClick={() => apply(t)}>
              <Td><span className="font-semibold">{t.name}</span></Td>
              <Td>{t.config.keys.map((k) => `${k.colA} ↔ ${k.colB}`).join(", ") || "–"}</Td>
              <Td>{t.config.compares.length ? t.config.compares.map((c) => c.label || c.colA).join(", ") : "–"}</Td>
              <Td nowrap>{fmtDT(t.savedAt)}</Td>
              <Td>
                <span onClick={(e) => e.stopPropagation()}>
                  <Menu placement="bottom end" trigger={<TriggerLabel tone="icon"><EllipsisVerticalIcon className="h-5 w-5" /></TriggerLabel>}
                    items={[{ id: "apply", label: "Apply to current files" }, { id: "download", label: "Download .json" }, { id: "delete", label: "Delete", danger: true }]}
                    onAction={(id) => (id === "apply" ? apply(t) : id === "download" ? downloadTemplate(t) : setDel(t))} />
                </span>
              </Td>
            </Tr>
          ))}
        </Tbl>
      </Card>

      <Modal open={!!del} title="Delete template?" onClose={() => setDel(null)} actions={[
        { label: "Cancel", kind: "outline" },
        { label: "Delete", kind: "danger", onClick: () => { r.deleteTemplate(del!.id); toast.success("Template deleted", del!.name); } },
      ]}>
        <p>&ldquo;{del?.name}&rdquo; will be removed from this browser. Downloaded .json copies are not affected. This cannot be undone.</p>
      </Modal>
      <Modal open={saveOpen} title="Save current mapping" onClose={() => setSaveOpen(false)} actions={[
        { label: "Cancel", kind: "outline" },
        { label: "Save", kind: "solid", onClick: () => {
          if (!name.trim()) { setErr("Enter a template name"); return false; }
          const t = r.saveTemplate(name.trim());
          toast.success("Template saved", t.name);
        } },
      ]}>
        <TextInput label="Template name" required value={name} error={err} onChange={(v) => { setName(v); setErr(""); }} placeholder="e.g. Monthly ledger vs billing" />
      </Modal>
    </>
  );
}
