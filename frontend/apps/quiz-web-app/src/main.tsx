import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { registerSW } from "virtual:pwa-register";
import { router } from "./router";
import { useStore } from "./store";
import { initTheme } from "./lib/theme";
import "./styles.css";

// Apply the persisted theme before first paint (incl. `system` + OS listener),
// so dark mode is correct on a cold load — not only after toggling in Settings.
initTheme(() => useStore.getState().settings.theme);

// Auto-update the service worker in the background (CSR PWA, offline-ready).
registerSW({ immediate: true });

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
