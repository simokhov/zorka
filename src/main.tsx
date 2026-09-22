import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Элемент #root не найден");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
