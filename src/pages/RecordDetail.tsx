/* RECIPE: Detail page = PageTitleBar(status chip, View Logs) -> 2/3 + 1/3 grid -> Steps, KV details, decision panel; audit trail in a Drawer. */
import { useState } from "react";
import { Button, useToast } from "@quantumphinance/kraft-component";
import { useParams } from "react-router-dom";
import { STATUS_TONE } from "../config";
import { useRecords } from "../features/records";
import type { RecordStatus } from "../features/records";
import { Card, PageHeader, PageTitleBar } from "../layout/PageHeader";
import { useApp } from "../lib/app";
import { fmt, fmtDT, inr } from "../lib/format";
import { Banner, Drawer, KV, Modal, Steps, StatusChip, Tbl, Td, Tr, TextArea } from "../ui";

const STEPS = ["Initiated", "In review", "Decision"];
const stepOf = (s: RecordStatus) => (s === "Draft" ? 0 : s === "Approved" || s === "Rejected" ? 2 : 1);

export default function RecordDetail() {
  const { id = "" } = useParams();
  const { get, decide } = useRecords();
  const { role } = useApp();
  const toast = useToast();
  const [logs, setLogs] = useState(false);
  const [dlg, setDlg] = useState<null | "approve" | "reject" | "sendback">(null);
  const [remark, setRemark] = useState("");
  const [err, setErr] = useState("");
  const r = get(id);
  if (!r) return <PageHeader title="Record not found" />;
  const canDecide = role === "checker" && (r.status === "Pending" || r.status === "In Review");
  const needRemark = dlg !== "approve";

  return (
    <>
      <PageTitleBar title={r.id} status={<StatusChip status={r.status} tones={STATUS_TONE} />} onViewLogs={() => setLogs(true)} />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card><Steps names={STEPS} current={stepOf(r.status)} /></Card>
          <Card title="Details">
            <KV rows={[["Name", r.name], ["Category", r.category], ["Amount (₹)", inr(r.amount)], ["Date", fmt(r.date)], ["Owner", r.owner], ["Notes", r.notes || "–"], ["Documents", r.files.join(", ") || "–"]]} />
          </Card>
        </div>
        <Card title="Decision">
          {canDecide ? (
            <div className="flex flex-col gap-2.5">
              <Button size="lg" onPress={() => setDlg("approve")}>Approve</Button>
              <Button size="lg" variant="outline" onPress={() => setDlg("sendback")}>Send Back</Button>
              <Button size="lg" variant="outline" color="danger" onPress={() => setDlg("reject")}>Reject</Button>
            </div>
          ) : (
            <Banner tone="info">{role === "checker" ? "No action pending on this record." : "Switch to the Checker role (user menu, top right) to review."}</Banner>
          )}
        </Card>
      </div>

      <Modal open={!!dlg} title={dlg === "approve" ? "Approve record?" : dlg === "reject" ? "Reject record?" : "Send back for changes?"} onClose={() => { setDlg(null); setRemark(""); setErr(""); }}
        actions={[
          { label: "Cancel", kind: "outline" },
          { label: dlg === "approve" ? "Approve" : dlg === "reject" ? "Reject" : "Send Back", kind: dlg === "reject" ? "danger" : "solid",
            onClick: () => {
              if (needRemark && !remark.trim()) { setErr("Remarks are mandatory"); return false; }
              decide(r.id, dlg!, remark.trim()); toast.success(`Record ${dlg === "approve" ? "approved" : dlg === "reject" ? "rejected" : "sent back"}`, r.id); setRemark("");
            } },
        ]}>
        <TextArea label={needRemark ? "Remarks" : "Remarks (optional)"} required={needRemark} value={remark} onChange={(v) => { setRemark(v); setErr(""); }} error={err} />
      </Modal>

      <Drawer open={logs} title={`Audit trail · ${r.id}`} onClose={() => setLogs(false)}>
        <Tbl heads={["When", "By", "Action", "Remarks"]}>
          {[...r.history].reverse().map((h, i) => (
            <Tr key={i}><Td nowrap>{fmtDT(h.at)}</Td><Td>{h.by}</Td><Td>{h.action}</Td><Td>{h.remark || "–"}</Td></Tr>
          ))}
        </Tbl>
      </Drawer>
    </>
  );
}
