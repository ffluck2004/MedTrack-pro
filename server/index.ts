// server/index.ts
import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

declare module "http" {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

export async function createApp(): Promise<Express> {
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
      "connect-src 'self' http://127.0.0.1:8000 https://accounts.google.com https://oauth2.googleapis.com",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
      "font-src 'self' https://fonts.gstatic.com",
    ].join("; ");

    res.setHeader("Content-Security-Policy", csp);
    next();
  });

  /* ================= BODY PARSING ================= */

  app.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // Register API routes
  await registerRoutes(app);

  // Frontend static serving (production)
  serveStatic(app);

  return app;
}

/* ================= LOCAL DEVELOPMENT BOOTSTRAP ================= */

if (process.env.VERCEL !== "1") {
  (async () => {
    const app = await createApp();
    const { createServer } = await import("http");
    const server = createServer(app);

    if (app.get("env") === "development") {
      await setupVite(app, server);
    }

    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen(port, "0.0.0.0", () => {
      log(`✅ Server running on http://0.0.0.0:${port}`);
    });
  })();
}
