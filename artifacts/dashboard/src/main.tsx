import { createRoot } from "react-dom/client";
import App from "./App";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import "./index.css";
import { initSecurity } from "./security";

const rawApiUrl = import.meta.env.VITE_API_URL || "https://apiserver.atozgroupsemarang.com";
const cleanedApiUrl = rawApiUrl.replace(/["'\r\n\t]+/g, "").trim().replace(/\/$/, "");
const apiUrl = (!cleanedApiUrl || cleanedApiUrl === "/" || cleanedApiUrl.includes("dashboard.atozgroupsemarang.com")) ? "https://apiserver.atozgroupsemarang.com" : cleanedApiUrl;
console.log("VITE_API_URL:", import.meta.env.VITE_API_URL, "API_URL:", apiUrl);
setBaseUrl(apiUrl);
setAuthTokenGetter(() => localStorage.getItem("auth_token"));

initSecurity();

createRoot(document.getElementById("root")!).render(<App />);
