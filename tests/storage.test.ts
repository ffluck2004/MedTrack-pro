import { describe, it, expect, beforeAll } from "vitest";
import { MemStorage } from "../server/storage";

let storage: MemStorage;

beforeAll(() => {
  storage = new MemStorage();
});

describe("MemStorage", () => {
  it("should initialize with sample medicines", async () => {
    const medicines = await storage.getMedicines();
    expect(medicines.length).toBeGreaterThanOrEqual(7);
    expect(medicines[0]).toHaveProperty("id");
    expect(medicines[0]).toHaveProperty("name");
    expect(medicines[0]).toHaveProperty("expiry_date");
  });

  it("should create and retrieve a medicine", async () => {
    const med = await storage.createMedicine({
      name: "Test Medicine",
      manufacturer: "Test Corp",
      stock: 100,
      category: "Analgesic",
      expiry_date: "2026-12-31",
      barcode: "TEST001",
      price: "99.99",
      cost: "50.00",
    });
    expect(med.name).toBe("Test Medicine");
    expect(med.stock).toBe(100);

    const fetched = await storage.getMedicine(med.id);
    expect(fetched).toBeDefined();
    expect(fetched!.name).toBe("Test Medicine");
  });

  it("should update a medicine", async () => {
    const meds = await storage.getMedicines();
    const updated = await storage.updateMedicine(meds[0].id, { stock: 999 });
    expect(updated).toBeDefined();
    expect(updated!.stock).toBe(999);
  });

  it("should delete a medicine", async () => {
    const med = await storage.createMedicine({
      name: "Delete Me",
      manufacturer: "Test",
      stock: 1,
      category: "Other",
      expiry_date: "2026-12-31",
      barcode: "DEL001",
      price: "10.00",
      cost: "5.00",
    });
    const deleted = await storage.deleteMedicine(med.id);
    expect(deleted).toBe(true);
    const fetched = await storage.getMedicine(med.id);
    expect(fetched).toBeUndefined();
  });

  it("should create and retrieve customers", async () => {
    const customer = await storage.createCustomer({
      name: "John Doe",
      phone: "1234567890",
      address: "123 Main St",
    });
    expect(customer.name).toBe("John Doe");

    const customers = await storage.getCustomers();
    expect(customers.some((c) => c.id === customer.id)).toBe(true);
  });

  it("should create and retrieve suppliers", async () => {
    const supplier = await storage.createSupplier({
      name: "Supplier Co",
      contactPerson: "Jane Smith",
      phone: "9876543210",
      email: "jane@supplier.com",
    });
    expect(supplier.name).toBe("Supplier Co");
    expect(supplier.contactPerson).toBe("Jane Smith");
  });

  it("should create a purchase order", async () => {
    const po = await storage.createPurchaseOrder({
      poNumber: "PO-TEST-001",
      supplierId: "test-supplier",
      date: new Date().toISOString(),
      items: JSON.stringify([
        { medicineId: "1", medicineName: "Test", quantity: 10, cost: 50, totalCost: 500 },
      ]),
      totalAmount: "500.00",
      status: "Pending",
    });
    expect(po.poNumber).toBe("PO-TEST-001");
    expect(po.status).toBe("Pending");
  });

  it("should create an invoice", async () => {
    const invoice = await storage.createInvoice({
      invoiceNumber: "INV-TEST-001",
      date: new Date().toISOString(),
      items: JSON.stringify([
        { medicineId: "1", medicineName: "Test", quantity: 5, price: 100, cost: 50, lineTotal: 500 },
      ]),
      subtotal: "500.00",
      discountValue: "0",
      taxAmount: "25.00",
      total: "525.00",
      totalCost: "250.00",
      paymentMethod: "Cash",
      adminName: "Admin",
      status: "Completed",
    });
    expect(invoice.invoiceNumber).toBe("INV-TEST-001");
    expect(invoice.total).toBe("525.00");

    const invoices = await storage.getInvoices();
    expect(invoices.some((i) => i.id === invoice.id)).toBe(true);
  });

  it("should create, get, and delete notes", async () => {
    const note = await storage.createNote({ text: "Test note", quantity: 5 });
    expect(note.text).toBe("Test note");

    const notes = await storage.getNotes();
    expect(notes.some((n) => n.id === note.id)).toBe(true);

    const deleted = await storage.deleteNote(note.id);
    expect(deleted).toBe(true);
  });
});
