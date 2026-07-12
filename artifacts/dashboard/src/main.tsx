import { createRoot } from "react-dom/client";
import App from "./App";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import "./index.css";

const rawApiUrl = import.meta.env.VITE_API_URL || "";
setBaseUrl(rawApiUrl.replace(/["'\r\n\t]+/g, "").trim().replace(/\/$/, ""));
setAuthTokenGetter(() => localStorage.getItem("auth_token"));

createRoot(document.getElementById("root")!).render(<App />);
