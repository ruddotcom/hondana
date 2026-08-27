import React from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.jsx";
import "./index.css";

const KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!KEY) {
  console.error("VITE_CLERK_PUBLISHABLE_KEY is missing — check .env.local");
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>
);