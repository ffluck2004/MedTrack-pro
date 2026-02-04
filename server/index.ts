// server/index.ts
import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

/* ================= CSP (SAFE & WORKING) ================= */

app.use((req, res, next) => {
  const isDev = app.get("env") === "development";

  const csp = [
    "default-src 'self'",
    isDev
      ? "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com"
      : "script-src 'self' https://accounts.google.com https://apis.google.com",
    "frame-src https://accounts.google.com",
    // "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com",
    "connect-src 'self' http://127.0.0.1:8000 https://accounts.google.com https://oauth2.googleapis.com",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
    "font-src 'self' https://fonts.gstatic.com",
  ].join("; ");

  res.setHeader("Content-Security-Policy", csp);
  next();
});

/* ================= BODY PARSING ================= */

declare module "http" {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: false }));

/* ================= BOOTSTRAP ================= */

(async () => {
  // 🔥🔥🔥 MOST IMPORTANT LINE 🔥🔥🔥
  // Register API routes FIRST
  const server = await registerRoutes(app);

  // 🔒 NEVER let Vite touch /api
  // app.use("/api", (_req, _res, next) => next());

  // Frontend handling AFTER API
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen(port, "localhost", () => {
    log(`✅ Server running on http://localhost:${port}`);
  });
})();
