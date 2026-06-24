import type { Express } from "express";
import { createServer, type Server } from "http";
import { randomUUID } from "crypto";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";
import { storage } from "./storage";
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }
  return ai;
}

export async function registerRoutes(app: Express, createHttp: boolean = true): Promise<Server | null> {
  // Medicines endpoints
  app.get("/api/medicines", async (req, res) => {
    try {
      const medicines = await storage.getMedicines();
      res.json(medicines);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medicines" });
    }
  });

  app.get("/api/medicines/:id", async (req, res) => {
    try {
      const medicine = await storage.getMedicine(req.params.id);
      if (!medicine) {
        return res.status(404).json({ error: "Medicine not found" });
      }
      res.json(medicine);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medicine" });
    }
  });

  app.post("/api/medicines", async (req, res) => {
    try {
      const medicine = await storage.createMedicine(req.body);
      res.status(201).json(medicine);
    } catch (error) {
      res.status(500).json({ error: "Failed to create medicine" });
    }
  });

  app.patch("/api/medicines/:id", async (req, res) => {
    try {
      const medicine = await storage.updateMedicine(req.params.id, req.body);
      if (!medicine) {
        return res.status(404).json({ error: "Medicine not found" });
      }
      res.json(medicine);
    } catch (error) {
      res.status(500).json({ error: "Failed to update medicine" });
    }
  });

  app.delete("/api/medicines/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMedicine(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Medicine not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete medicine" });
    }
  });

  // Customers endpoints
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customer = await storage.createCustomer(req.body);
      res.status(201).json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCustomer(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  // Suppliers endpoints
  app.get("/api/suppliers", async (req, res) => {
    try {
      const suppliers = await storage.getSuppliers();
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", async (req, res) => {
    try {
      const supplier = await storage.createSupplier(req.body);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });

  app.patch("/api/suppliers/:id", async (req, res) => {
    try {
      const supplier = await storage.updateSupplier(req.params.id, req.body);
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.json(supplier);
    } catch (error) {
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });

  app.delete("/api/suppliers/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteSupplier(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });

  // Purchase Orders endpoints
  app.get("/api/purchase-orders", async (req, res) => {
    try {
      const orders = await storage.getPurchaseOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch purchase orders" });
    }
  });

  app.post("/api/purchase-orders", async (req, res) => {
    try {
      const order = await storage.createPurchaseOrder(req.body);
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to create purchase order" });
    }
  });

  // Invoices endpoints
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", async (req, res) => {
    try {
      // Generate invoice number
      const invoices = await storage.getInvoices();
      const invoiceNumber = `INV-${(invoices.length + 1).toString().padStart(5, "0")}`;

      // Parse items from JSON string
      const items = typeof req.body.items === "string" ? req.body.items : JSON.stringify(req.body.items);

      const invoice = await storage.createInvoice({
        ...req.body,
        invoiceNumber,
        items,
      });

      // Update medicine stock
      const itemsArray = JSON.parse(items);
      for (const item of itemsArray) {
        const medicine = await storage.getMedicine(item.medicineId);
        if (medicine) {
          await storage.updateMedicine(item.medicineId, {
            stock: medicine.stock - item.quantity,
          });
        }
      }

      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ error: "Failed to create invoice" });
    }
  });

  // Notes endpoints
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await storage.getNotes();
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const note = await storage.createNote(req.body);
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.delete("/api/notes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteNote(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // AI Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, medicines } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Parse medicines data
      const medicinesData = typeof medicines === "string" ? JSON.parse(medicines) : medicines;

      // Create context with medicine inventory
      const medicineContext = medicinesData
        .map((m: any) => `${m.name} (${m.manufacturer}): Stock: ${m.stock}, Price: ₹${m.price}, Category: ${m.category}, Expiry: ${m.expiryDate}`)
        .join("\n");

      const systemPrompt = `You are a helpful pharmacy inventory assistant for MedTrack Pro. 
You have access to the current medicine inventory and can answer questions about stock levels, pricing, expiry dates, and general pharmacy information.
Be concise, professional, and helpful. If asked about specific medicines, refer to the inventory data provided.

Current Inventory:
${medicineContext}`;

      const prompt = `${systemPrompt}\n\nUser question: ${message}`;

      const response = await getAI().models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
      });

      const responseText = response.text || "I'm sorry, I couldn't generate a response.";

      res.json({ response: responseText });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  /* ================= AUTH (LOCAL DEV) ================= */

  interface StoredUser {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
    salt: string;
    role: string;
    createdAt: Date;
  }

  const users = new Map<string, StoredUser>();

  function hashPassword(password: string): { hash: string; salt: string } {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    return { hash, salt };
  }

  function verifyPassword(password: string, hash: string, salt: string): boolean {
    const derivedHash = scryptSync(password, salt, 64).toString("hex");
    return derivedHash === hash;
  }

  // Seed demo user
  const DEMO_EMAIL = "demo@medtrackpro.com";
  const DEMO_PASSWORD = "Demo@123";
  (() => {
    const { hash, salt } = hashPassword(DEMO_PASSWORD);
    users.set("demo-user-id", { id: "demo-user-id", email: "demo@medtrackpro.com", username: "Demo Admin", passwordHash: hash, salt, role: "STAFF", createdAt: new Date() });
  })();

  // In-memory session store
  // In-memory session store
  const sessions = new Map<string, { userId: string; email: string; username: string; role: string }>();

  function setSessionCookie(res: any, sessionId: string) {
    res.cookie("session_token", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  function clearSessionCookie(res: any) {
    res.clearCookie("session_token", { path: "/" });
  }

  function getSessionUser(req: any): { userId: string; email: string; username: string; role: string } | null {
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

  app.get("/api/auth/me/", (req, res) => {
    const sessionUser = getSessionUser(req);
    if (sessionUser) {
      res.json({ user: { id: sessionUser.userId, email: sessionUser.email, username: sessionUser.username, role: sessionUser.role } });
    } else {
      res.json({ user: null });
    }
  });

  app.post("/api/auth/google-login/", async (req, res) => {
    try {
      const { id_token } = req.body;
      if (!id_token) {
        return res.status(400).json({ error: "id_token is required" });
      }
      const { OAuth2Client } = await import("google-auth-library");
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({ idToken: id_token, audience: process.env.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(400).json({ error: "Invalid token payload" });
      }
      const sessionId = randomUUID();
      sessions.set(sessionId, { userId: payload.sub, email: payload.email!, username: payload.name || payload.email!, role: "STAFF" });
      setSessionCookie(res, sessionId);
      res.json({ user: { id: payload.sub, email: payload.email, username: payload.name || payload.email, role: "STAFF" } });
    } catch (err) {
      console.error("Google login error:", err);
      res.status(401).json({ error: "Google authentication failed" });
    }
  });

  if (createHttp) {
    const httpServer = createServer(app);
    return httpServer;
  }
  return null;
}
