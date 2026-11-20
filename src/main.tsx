import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { ToastProvider } from "@quantumphinance/kraft-component";
import "@quantumphinance/kraft-component/styles.css";
import "./index.css";
import App from "./App";
import { ReconProvider } from "./features/recon";
import { AppProvider } from "./lib/app";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <ToastProvider>
        <AppProvider>
          <ReconProvider>
            <App />
          </ReconProvider>
        </AppProvider>
      </ToastProvider>
    </HashRouter>
  </React.StrictMode>
);
