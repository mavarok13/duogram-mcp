import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/500.css";
import "@fontsource/open-sans/700.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/500.css";
import "@fontsource/source-sans-3/700.css";

import { App } from "./App.js";
import "./styles.css";

const root = document.getElementById("root");
if (root === null) throw new Error("missing renderer root");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
