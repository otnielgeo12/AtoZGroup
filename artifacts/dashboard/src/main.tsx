import { createRoot } from "react-dom/client";
import App from "./App";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import "./index.css";

setBaseUrl(import.meta.env.VITE_API_URL || "");
setAuthTokenGetter(() => localStorage.getItem("auth_token"));

createRoot(document.getElementById("root")!).render(<App />);
