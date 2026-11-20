import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./layout/AppShell";
import { useRecords } from "./features/records";
import Dashboard from "./pages/Dashboard";
import DesignSystem from "./pages/DesignSystem";
import Import from "./pages/Import";
import NotFound from "./pages/NotFound";
import RecordDetail from "./pages/RecordDetail";
import RecordForm from "./pages/RecordForm";
import RecordsList from "./pages/RecordsList";
import Report from "./pages/Report";

/**
 * Route path === nav item id in src/config.ts (detail pages map to their parent via activeNavFor).
 * Add a page: 1) src/pages/X.tsx  2) <Route> below  3) nav item in src/config.ts.
 */
export default function App() {
  const { recs, reset } = useRecords();
  const open = recs.filter((r) => r.status === "Pending" || r.status === "In Review").length;
  return (
    <Routes>
      <Route element={<AppShell navCounts={{ records: open }} onReset={reset} />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="records" element={<RecordsList />} />
        <Route path="records/new" element={<RecordForm />} />
        <Route path="records/:id" element={<RecordDetail />} />
        <Route path="reports/summary" element={<Report />} />
        <Route path="import" element={<Import />} />
        <Route path="design-system" element={<DesignSystem />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
