import { createRoot } from "react-dom/client";
import { migrateAllLegacyStorage } from "@/lib/storageMigrate";
import App from "./App.tsx";
import "./index.css";

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });
}

migrateAllLegacyStorage();

if (typeof window !== "undefined") {
  createRoot(document.getElementById("root")!).render(<App />);
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
