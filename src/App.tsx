import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./layout/AppShell";
import { useRecon } from "./features/recon";
import DesignSystem from "./pages/DesignSystem";
import Home from "./pages/Home";
import Mapping from "./pages/Mapping";
import NotFound from "./pages/NotFound";
import Results from "./pages/Results";
import Templates from "./pages/Templates";
import Upload from "./pages/Upload";

/**
 * Route path === nav item id in src/config.ts.
 * Workflow: 1. Upload → 2. Map & Transform → 3. Results & Export.
 */
export default function App() {
  const { result, stale, reset } = useRecon();
  const s = result?.summary;
  const exceptions = s && !stale ? s.mismatched + s.missingInA + s.missingInB + s.duplicateRows : 0;
  return (
    <Routes>
      <Route element={<AppShell navCounts={{ exceptions }} onReset={reset} />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Home />} />
        <Route path="recon/upload" element={<Upload />} />
        <Route path="recon/map" element={<Mapping />} />
        <Route path="recon/results" element={<Results />} />
        <Route path="templates" element={<Templates />} />
        <Route path="design-system" element={<DesignSystem />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
