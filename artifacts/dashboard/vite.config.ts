import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import crypto from "crypto";
import https from "https";

// ── Built-in JWT helpers (no external deps needed) ──────────────────
const JWT_SECRET = "local-development-secret-key-change-in-production";

function createJwt(payload: Record<string, unknown>) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    })
  ).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64url");
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Known admin credentials (local fallback) ────────────────────────
const ADMIN_USERS = [
  { id: 1, username: "atoz", password: "Atoz2026%", email: "admin@atozgroup.id", role: "super_admin" },
  { id: 2, username: "superadmin", password: "super123", email: "admin@atozgroup.id", role: "super_admin" },
  { id: 3, username: "admin", password: "admin123", email: "admin@atozgroup.id", role: "super_admin" },
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawPort = env.PORT || "5173";
  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  const basePath = env.BASE_PATH ?? "/";

  // Server targets
  const API_SERVER_HOST = "apiserver.atozgroupsemarang.com";
  const API_SERVER = `https://${API_SERVER_HOST}`;   // General API (auth, users, images, etc.)
  const API_CLONE  = "https://apiclone.atozgroupsemarang.com";    // CRM data only
  const API_D5     = "https://apid5.atozgroupsemarang.com";       // Ladies menu

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss({ optimize: false }),
      runtimeErrorOverlay(),
      ...(env.NODE_ENV !== "production" &&
      env.REPL_ID !== undefined
        ? [
            import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer({
                root: path.resolve(import.meta.dirname, ".."),
              }),
            ),
            import("@replit/vite-plugin-dev-banner").then((m) =>
              m.devBanner(),
            ),
          ]
        : []),
      // ── Local Auth Middleware Plugin ───────────────────────────────
      // Handles /api/auth/* locally first. If credentials don't match
      // the local list, falls through to let the proxy handle it
      // (so apiserver's own users still work).
      {
        name: "local-auth-middleware",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Only handle /api/auth/* paths
            if (!req.url?.startsWith("/api/auth")) return next();

            // Parse body for POST requests
            if (req.method === "POST") {
              let body = "";
              req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
              req.on("end", () => {
                try {
                  const parsed = JSON.parse(body);
                  handleAuth(req.url!, parsed, req, res, next);
                } catch {
                  res.writeHead(400, { "Content-Type": "application/json" });
                  res.end(JSON.stringify({ error: "Invalid request body" }));
                }
              });
              return;
            }

            // GET requests (e.g. /api/auth/me)
            handleAuth(req.url!, {}, req, res, next);
          });

          // Forward a request to apiserver directly (handles consumed body)
          function forwardToApiServer(
            method: string,
            apiPath: string,
            bodyStr: string | null,
            reqHeaders: Record<string, string | string[] | undefined>,
            res: import("http").ServerResponse
          ) {
            const headers: Record<string, string> = {
              "host": API_SERVER_HOST,
              "content-type": "application/json",
            };
            if (reqHeaders.authorization) headers.authorization = reqHeaders.authorization as string;
            if (bodyStr) headers["content-length"] = String(Buffer.byteLength(bodyStr));

            const proxyReq = https.request(
              { hostname: API_SERVER_HOST, port: 443, path: apiPath, method, headers, timeout: 8000 },
              (proxyRes) => {
                res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
                proxyRes.pipe(res, { end: true });
              }
            );
            proxyReq.on("error", (err) => {
              console.log(`[apiserver proxy error] ${err.message}`);
              if (!res.headersSent) {
                res.writeHead(502, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "apiserver temporarily unavailable" }));
              }
            });
            proxyReq.on("timeout", () => {
              proxyReq.destroy();
              if (!res.headersSent) {
                res.writeHead(504, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: "apiserver request timed out" }));
              }
            });
            if (bodyStr) proxyReq.write(bodyStr);
            proxyReq.end();
          }

          function handleAuth(
            url: string,
            body: Record<string, string>,
            req: import("http").IncomingMessage,
            res: import("http").ServerResponse,
            next: () => void
          ) {
            res.setHeader("Content-Type", "application/json");

            // ── POST /api/auth/login ──
            if (url.startsWith("/api/auth/login")) {
              const { username, password } = body;
              if (!username || !password) {
                res.writeHead(400);
                return res.end(JSON.stringify({ error: "Username and password are required" }));
              }

              // Try local credentials first
              const user = ADMIN_USERS.find(
                (u) => u.username === username && u.password === password
              );

              if (user) {
                const token = createJwt({ id: user.id, username: user.username, role: user.role });
                console.log(`✅ Login OK (local): ${user.username} (${user.role})`);
                res.writeHead(200);
                return res.end(
                  JSON.stringify({
                    token,
                    user: { id: user.id, username: user.username, email: user.email, role: user.role },
                  })
                );
              }

              // Not in local list → forward directly to apiserver
              console.log(`🔄 Login "${username}" not in local list, forwarding to apiserver...`);
              return forwardToApiServer("POST", "/api/auth/login", JSON.stringify(body), req.headers as any, res);
            }

            // ── GET /api/auth/me ──
            if (url.startsWith("/api/auth/me")) {
              const authHeader = req.headers.authorization || "";
              if (!authHeader.startsWith("Bearer ")) {
                // No token → forward to apiserver
                return forwardToApiServer("GET", "/api/auth/me", null, req.headers as any, res);
              }
              const token = authHeader.replace("Bearer ", "").trim();
              const payload = verifyJwt(token);

              if (payload) {
                // Token from our local JWT → respond locally
                const user = ADMIN_USERS.find((u) => u.id === payload.id) || {
                  id: payload.id,
                  username: payload.username,
                  email: "admin@atozgroup.id",
                  role: payload.role || "super_admin",
                };
                res.writeHead(200);
                return res.end(
                  JSON.stringify({ id: user.id, username: user.username, email: user.email, role: user.role })
                );
              }

              // Token not from us → let apiserver verify it
              return forwardToApiServer("GET", "/api/auth/me", null, req.headers as any, res);
            }

            // ── POST /api/auth/change-password ──
            if (url.startsWith("/api/auth/change-password")) {
              return forwardToApiServer("POST", "/api/auth/change-password", JSON.stringify(body), req.headers as any, res);
            }

            // Other auth paths → forward to apiserver
            return forwardToApiServer(req.method || "GET", url, Object.keys(body).length ? JSON.stringify(body) : null, req.headers as any, res);
          }
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
        ...(env.NODE_ENV !== "production" ? {
          "@clerk/react$": path.resolve(import.meta.dirname, "src/lib/clerk-mock.tsx"),
          "@clerk/react/internal$": path.resolve(import.meta.dirname, "src/lib/clerk-mock.tsx"),
        } : {}),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      proxy: {
        // ── CRM API → apiclone (khusus CRM data: insights, members, outlets) ──
        "/vsoft-api": {
          target: (() => {
            try {
              const u = new URL(env.VITE_CRM_API_URL || API_CLONE);
              return u.origin;
            } catch(e) { return API_CLONE; }
          })(),
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/vsoft-api/, ""),
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.log("[vsoft-api proxy error]", err.message);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log("→ CRM:", req.method, proxyReq.host + proxyReq.path);
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              console.log("← CRM:", proxyRes.statusCode, req.url);
            });
          },
        },
        // ── General API → apiserver (auth, users, banners, images, etc.) ──
        // Auth requests that match local credentials are handled by middleware above.
        // All other requests (including non-local auth) pass through to apiserver.
        "/api": {
          target: API_SERVER,
          changeOrigin: true,
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, res) => {
              console.log("[api proxy error]", err.message);
              // If apiserver is down, return a clean error instead of hanging
              if (!res.headersSent) {
                (res as any).writeHead(502, { "Content-Type": "application/json" });
                (res as any).end(JSON.stringify({ error: "apiserver temporarily unavailable" }));
              }
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log("→ API:", req.method, proxyReq.path);
            });
          },
        },
      },
      fs: {
        strict: true,
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
