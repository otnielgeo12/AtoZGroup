import { createRoot } from "react-dom/client";
import App from "./App";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import "./index.css";

const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_CRM_API_URL || "https://apiclone.atozgroupsemarang.com";
const cleanedApiUrl = rawApiUrl.replace(/["'\r\n\t]+/g, "").trim().replace(/\/$/, "");
const apiUrl = (!cleanedApiUrl || cleanedApiUrl === "/" || cleanedApiUrl.includes("dashboard.atozgroupsemarang.com")) ? "https://apiclone.atozgroupsemarang.com" : cleanedApiUrl;
setBaseUrl(apiUrl);
setAuthTokenGetter(() => localStorage.getItem("auth_token"));

createRoot(document.getElementById("root")!).render(<App />);
