import express from "express";
import path from "path";
import fs from "fs";
import { registerRoutes } from "../server/routes";

const app = express();

/* ================= BODY PARSING ================= */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* ================= CSP SECURITY HEADERS ================= */
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
      "frame-src https://accounts.google.com",
      "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
      "font-src 'self' https://fonts.gstatic.com",
    ].join("; ")
  );
  next();
});

/* ================= REGISTER API ROUTES ================= */
registerRoutes(app, false);

/* ================= SERVE STATIC FRONTEND FILES ================= */
const possiblePaths = [
  path.join(process.cwd(), "dist", "public"),
  path.join(process.cwd(), "public"),
];

let distPublic = possiblePaths.find((p) => fs.existsSync(p));
if (!distPublic) {
  distPublic = possiblePaths[0];
}

if (fs.existsSync(distPublic)) {
  app.use(express.static(distPublic));
}

/* ================= SPA FALLBACK ================= */
app.get("*", (_req, res) => {
  const indexPath = path.join(distPublic, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({
      name: "MedTrackPro API",
      version: "1.0.0",
      status: "running",
    });
  }
});

export default app;
