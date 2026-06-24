import express from "express";
import path from "path";
import fs from "fs";
import { randomUUID, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import cookieParser from "cookie-parser";
import { GoogleGenAI } from "@google/genai";
import { OAuth2Client } from "google-auth-library";

/* ================= TYPES (mirror of @shared/schema) ================= */

interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  stock: number;
  category: string;
  expiry_date: string;
  barcode: string;
  price: string;
  cost: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
}

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
}

interface PurchaseOrderItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  cost: number;
  totalCost: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  date: string;
  items: string;
  totalAmount: string;
  status: string;
}

interface InvoiceItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  cost: number;
  lineTotal: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  items: string;
  subtotal: string;
  discountValue: string;
  taxAmount: string;
  total: string;
  totalCost: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  paymentMethod: string;
  cashPaid: string | null;
  upiPaid: string | null;
  adminName: string;
  status: string;
}

interface Note {
  id: string;
  text: string;
  quantity: number | null;
  createdAt: Date;
}

/* ================= IN-MEMORY STORAGE ================= */

class ApiStorage {
  private medicines = new Map<string, Medicine>();
  private customers = new Map<string, Customer>();
  private suppliers = new Map<string, Supplier>();
  private purchaseOrders = new Map<string, PurchaseOrder>();
  private invoices = new Map<string, Invoice>();
  private notes = new Map<string, Note>();

  constructor() {
    this.seedData();
  }

  private seedData() {
    const now = new Date();
    const sampleMeds: Medicine[] = [
      { id: randomUUID(), name: "Paracetamol 500mg", manufacturer: "Pharma Inc.", stock: 150, category: "Analgesic", expiry_date: new Date(now.getTime() + 365 * 86400000).toISOString().split("T")[0], barcode: "8901234567890", price: "30.00", cost: "15.00" },
      { id: randomUUID(), name: "Amoxicillin 250mg", manufacturer: "MediHealth", stock: 80, category: "Antibiotic", expiry_date: new Date(now.getTime() + 180 * 86400000).toISOString().split("T")[0], barcode: "8902345678901", price: "150.00", cost: "95.00" },
      { id: randomUUID(), name: "Ibuprofen 200mg", manufacturer: "Pharma Inc.", stock: 200, category: "Analgesic", expiry_date: new Date(now.getTime() + 45 * 86400000).toISOString().split("T")[0], barcode: "8903456789012", price: "50.00", cost: "25.00" },
      { id: randomUUID(), name: "Vitamin C 1000mg", manufacturer: "VitaLife", stock: 300, category: "Vitamin", expiry_date: new Date(now.getTime() + 730 * 86400000).toISOString().split("T")[0], barcode: "8904567890123", price: "80.00", cost: "40.00" },
      { id: randomUUID(), name: "Aspirin 75mg", manufacturer: "MediHealth", stock: 0, category: "Analgesic", expiry_date: new Date(now.getTime() + 300 * 86400000).toISOString().split("T")[0], barcode: "8905678901234", price: "20.00", cost: "10.00" },
      { id: randomUUID(), name: "Saline Solution", manufacturer: "Sterile Co.", stock: 50, category: "Antiseptic", expiry_date: new Date(now.getTime() - 10 * 86400000).toISOString().split("T")[0], barcode: "8906789012345", price: "60.00", cost: "30.00" },
      { id: randomUUID(), name: "Flu Vaccine", manufacturer: "VaxCorp", stock: 25, category: "Vaccine", expiry_date: new Date(now.getTime() + 90 * 86400000).toISOString().split("T")[0], barcode: "8907890123456", price: "500.00", cost: "350.00" },
    ];
    sampleMeds.forEach((m) => this.medicines.set(m.id, m));
  }

  async getMedicines(): Promise<Medicine[]> { return Array.from(this.medicines.values()); }
  async getMedicine(id: string): Promise<Medicine | undefined> { return this.medicines.get(id); }
  async createMedicine(med: any): Promise<Medicine> { const id = randomUUID(); const m = { ...med, id }; this.medicines.set(id, m as Medicine); return m as Medicine; }
  async updateMedicine(id: string, updates: any): Promise<Medicine | undefined> {
    const existing = this.medicines.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates } as Medicine;
    this.medicines.set(id, updated);
    return updated;
  }
  async deleteMedicine(id: string): Promise<boolean> { return this.medicines.delete(id); }

  async getCustomers(): Promise<Customer[]> { return Array.from(this.customers.values()); }
  async getCustomer(id: string): Promise<Customer | undefined> { return this.customers.get(id); }
  async createCustomer(data: any): Promise<Customer> { const id = randomUUID(); const c = { ...data, id, address: data.address || null }; this.customers.set(id, c as Customer); return c as Customer; }
  async updateCustomer(id: string, updates: any): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.customers.set(id, updated);
    return updated;
  }
  async deleteCustomer(id: string): Promise<boolean> { return this.customers.delete(id); }

  async getSuppliers(): Promise<Supplier[]> { return Array.from(this.suppliers.values()); }
  async getSupplier(id: string): Promise<Supplier | undefined> { return this.suppliers.get(id); }
  async createSupplier(data: any): Promise<Supplier> { const id = randomUUID(); const s = { ...data, id }; this.suppliers.set(id, s as Supplier); return s as Supplier; }
  async updateSupplier(id: string, updates: any): Promise<Supplier | undefined> {
    const existing = this.suppliers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.suppliers.set(id, updated);
    return updated;
  }
  async deleteSupplier(id: string): Promise<boolean> { return this.suppliers.delete(id); }

  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return Array.from(this.purchaseOrders.values()).sort((a, b) => b.date.localeCompare(a.date));
  }
  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> { return this.purchaseOrders.get(id); }
  async createPurchaseOrder(data: any): Promise<PurchaseOrder> {
    const id = randomUUID();
    const po = { ...data, id } as PurchaseOrder;
    this.purchaseOrders.set(id, po);
    return po;
  }

  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).sort((a, b) => b.date.localeCompare(a.date));
  }
  async getInvoice(id: string): Promise<Invoice | undefined> { return this.invoices.get(id); }
  async createInvoice(data: any): Promise<Invoice> {
    const id = randomUUID();
    const inv = { ...data, id } as Invoice;
    this.invoices.set(id, inv);
    return inv;
  }

  async getNotes(): Promise<Note[]> {
    return Array.from(this.notes.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async createNote(data: any): Promise<Note> {
    const id = randomUUID();
    const note = { ...data, id, quantity: data.quantity || null, createdAt: new Date() } as Note;
    this.notes.set(id, note);
    return note;
  }
  async deleteNote(id: string): Promise<boolean> { return this.notes.delete(id); }
}

const storage = new ApiStorage();

/* ================= GOOGLE AI (LAZY) ================= */

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }
  return aiClient;
}

/* ================= GOOGLE OAUTH ================= */

const GOOGLE_OAUTH_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  "371449211399-59bpqpbu0b19lp0lp08i2pbf34t4f13c.apps.googleusercontent.com";
const authClient = new OAuth2Client(GOOGLE_OAUTH_CLIENT_ID);

/* ================= EXPRESS APP ================= */

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use((_req, res, next) => {
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

/* ================= API ROUTES ================= */

// Medicines
app.get("/api/medicines", async (_req, res) => {
  try { res.json(await storage.getMedicines()); }
  catch { res.status(500).json({ error: "Failed to fetch medicines" }); }
});

app.get("/api/medicines/:id", async (req, res) => {
  try {
    const m = await storage.getMedicine(req.params.id);
    if (!m) return res.status(404).json({ error: "Medicine not found" });
    res.json(m);
  } catch { res.status(500).json({ error: "Failed to fetch medicine" }); }
});

app.post("/api/medicines", async (req, res) => {
  try { res.status(201).json(await storage.createMedicine(req.body)); }
  catch { res.status(500).json({ error: "Failed to create medicine" }); }
});

app.patch("/api/medicines/:id", async (req, res) => {
  try {
    const m = await storage.updateMedicine(req.params.id, req.body);
    if (!m) return res.status(404).json({ error: "Medicine not found" });
    res.json(m);
  } catch { res.status(500).json({ error: "Failed to update medicine" }); }
});

app.delete("/api/medicines/:id", async (req, res) => {
  try {
    const deleted = await storage.deleteMedicine(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Medicine not found" });
    res.status(204).send();
  } catch { res.status(500).json({ error: "Failed to delete medicine" }); }
});

// Customers
app.get("/api/customers", async (_req, res) => {
  try { res.json(await storage.getCustomers()); }
  catch { res.status(500).json({ error: "Failed to fetch customers" }); }
});

app.post("/api/customers", async (req, res) => {
  try { res.status(201).json(await storage.createCustomer(req.body)); }
  catch { res.status(500).json({ error: "Failed to create customer" }); }
});

app.patch("/api/customers/:id", async (req, res) => {
  try {
    const c = await storage.updateCustomer(req.params.id, req.body);
    if (!c) return res.status(404).json({ error: "Customer not found" });
    res.json(c);
  } catch { res.status(500).json({ error: "Failed to update customer" }); }
});

app.delete("/api/customers/:id", async (req, res) => {
  try {
    const deleted = await storage.deleteCustomer(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Customer not found" });
    res.status(204).send();
  } catch { res.status(500).json({ error: "Failed to delete customer" }); }
});

// Suppliers
app.get("/api/suppliers", async (_req, res) => {
  try { res.json(await storage.getSuppliers()); }
  catch { res.status(500).json({ error: "Failed to fetch suppliers" }); }
});

app.post("/api/suppliers", async (req, res) => {
  try { res.status(201).json(await storage.createSupplier(req.body)); }
  catch { res.status(500).json({ error: "Failed to create supplier" }); }
});

app.patch("/api/suppliers/:id", async (req, res) => {
  try {
    const s = await storage.updateSupplier(req.params.id, req.body);
    if (!s) return res.status(404).json({ error: "Supplier not found" });
    res.json(s);
  } catch { res.status(500).json({ error: "Failed to update supplier" }); }
});

app.delete("/api/suppliers/:id", async (req, res) => {
  try {
    const deleted = await storage.deleteSupplier(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Supplier not found" });
    res.status(204).send();
  } catch { res.status(500).json({ error: "Failed to delete supplier" }); }
});

// Purchase Orders
app.get("/api/purchase-orders", async (_req, res) => {
  try { res.json(await storage.getPurchaseOrders()); }
  catch { res.status(500).json({ error: "Failed to fetch purchase orders" }); }
});

app.post("/api/purchase-orders", async (req, res) => {
  try { res.status(201).json(await storage.createPurchaseOrder(req.body)); }
  catch { res.status(500).json({ error: "Failed to create purchase order" }); }
});

// Invoices
app.get("/api/invoices", async (_req, res) => {
  try { res.json(await storage.getInvoices()); }
  catch { res.status(500).json({ error: "Failed to fetch invoices" }); }
});

app.post("/api/invoices", async (req, res) => {
  try {
    const invoices = await storage.getInvoices();
    const invoiceNumber = `INV-${(invoices.length + 1).toString().padStart(5, "0")}`;
    const items = typeof req.body.items === "string" ? req.body.items : JSON.stringify(req.body.items);
    const invoice = await storage.createInvoice({ ...req.body, invoiceNumber, items });
    const itemsArray = JSON.parse(items);
    for (const item of itemsArray) {
      const med = await storage.getMedicine(item.medicineId);
      if (med) {
        await storage.updateMedicine(item.medicineId, { stock: med.stock - item.quantity });
      }
    }
    res.status(201).json(invoice);
  } catch (err) {
    console.error("Error creating invoice:", err);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// Notes
app.get("/api/notes", async (_req, res) => {
  try { res.json(await storage.getNotes()); }
  catch { res.status(500).json({ error: "Failed to fetch notes" }); }
});

app.post("/api/notes", async (req, res) => {
  try { res.status(201).json(await storage.createNote(req.body)); }
  catch { res.status(500).json({ error: "Failed to create note" }); }
});

app.delete("/api/notes/:id", async (req, res) => {
  try {
    const deleted = await storage.deleteNote(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Note not found" });
    res.status(204).send();
  } catch { res.status(500).json({ error: "Failed to delete note" }); }
});

// AI Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, medicines } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });
    const medicinesData = typeof medicines === "string" ? JSON.parse(medicines) : medicines;
    const ctx = (medicinesData || [])
      .map((m: any) => `${m.name} (${m.manufacturer}): Stock: ${m.stock}, Price: ₹${m.price}, Category: ${m.category}, Expiry: ${m.expiryDate}`)
      .join("\n");
    const prompt = `You are a helpful pharmacy inventory assistant for MedTrack Pro.\nCurrent Inventory:\n${ctx}\n\nUser question: ${message}`;
    const response = await getAI().models.generateContent({ model: "gemini-2.0-flash-exp", contents: prompt });
    res.json({ response: response.text || "I'm sorry, I couldn't generate a response." });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

/* ================= PASSWORD HELPERS ================= */

interface StoredUser {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: string;
  createdAt: Date;
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || randomBytes(16).toString("hex");
  const hash = scryptSync(password, s, 64).toString("hex");
  return { hash, salt: s };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computed } = hashPassword(password, salt);
  return timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

/* ================= USER STORE ================= */

const users = new Map<string, StoredUser>();

// ── Seed demo user for recruiter demo mode ──
const DEMO_EMAIL = "demo@medtrackpro.com";
const DEMO_PASSWORD = "Demo@123";
(() => {
  const { hash, salt } = hashPassword(DEMO_PASSWORD);
  users.set("demo-user-id", { id: "demo-user-id", email: DEMO_EMAIL, username: "Demo Admin", passwordHash: hash, salt, role: "STAFF", createdAt: new Date() });
})();

/* ================= AUTH ================= */

// In-memory session store
const sessions = new Map<string, { userId: string; email: string; username: string; role: string }>();

function setSessionCookie(res: any, sessionId: string) {
  res.cookie("session_token", sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearSessionCookie(res: any) {
  res.clearCookie("session_token", { path: "/" });
}

function getSessionUser(req: express.Request): { userId: string; email: string; username: string; role: string } | null {
  const token = req.cookies?.session_token;
  if (!token) return null;
  return sessions.get(token) || null;
}

app.post("/api/auth/register/", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: "email, username, and password are required" });
    }
    if (Array.from(users.values()).some((u) => u.email === email.toLowerCase())) {
      return res.status(409).json({ error: "A user with this email already exists" });
    }
    const id = randomUUID();
    const { hash, salt } = hashPassword(password);
    users.set(id, { id, email: email.toLowerCase(), username, passwordHash: hash, salt, role: "STAFF", createdAt: new Date() });
    res.status(201).json({ message: "Account created" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login/", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    const user = Array.from(users.values()).find((u) => u.email === email.toLowerCase());
    if (!user || !verifyPassword(password, user.passwordHash, user.salt)) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const sessionId = randomUUID();
    sessions.set(sessionId, { userId: user.id, email: user.email, username: user.username, role: user.role });
    setSessionCookie(res, sessionId);
    res.json({ user: { id: user.id, email: user.email, username: user.username, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/logout/", (req, res) => {
  const token = req.cookies?.session_token;
  if (token) sessions.delete(token);
  clearSessionCookie(res);
  res.json({ message: "Logged out" });
});

app.post("/api/auth/google-login/", async (req, res) => {
  try {
    const { id_token } = req.body;
    if (!id_token) {
      return res.status(400).json({ error: "Missing id_token" });
    }

    // Verify the ID token with Google
    const ticket = await authClient.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_OAUTH_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: "Invalid Google token" });
    }

    // Create or retrieve user session
    const userEmail = payload.email;
    const userName = payload.name || userEmail!;
    const sessionId = randomUUID();
    sessions.set(sessionId, { userId: payload.sub, email: userEmail!, username: userName, role: "STAFF" });
    setSessionCookie(res, sessionId);

    res.json({
      user: {
        id: payload.sub,
        email: userEmail,
        username: userName,
        role: "STAFF",
      },
    });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ error: "Google authentication failed" });
  }
});

app.get("/api/auth/me/", (req, res) => {
  const sessionUser = getSessionUser(req);
  if (sessionUser) {
    res.json({ user: { id: sessionUser.userId, email: sessionUser.email, username: sessionUser.username, role: sessionUser.role } });
  } else {
    res.json({ user: null });
  }
});

/* ================= STATIC FILES ================= */

const distPublic = path.join(process.cwd(), "dist", "public");
if (fs.existsSync(distPublic)) {
  app.use(express.static(distPublic));
}

app.get("*", (_req, res) => {
  const indexPath = path.join(distPublic, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({ name: "MedTrackPro API", version: "1.0.0", status: "running" });
  }
});

export default app;
