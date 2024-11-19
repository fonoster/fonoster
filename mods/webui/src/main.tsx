import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { fnLight } from "./theme.ts";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={fnLight}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);
