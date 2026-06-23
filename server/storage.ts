import {
  type Medicine,
  type InsertMedicine,
  type Customer,
  type InsertCustomer,
  type Supplier,
  type InsertSupplier,
  type PurchaseOrder,
  type InsertPurchaseOrder,
  type Invoice,
  type InsertInvoice,
  type Note,
  type InsertNote,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Medicines
  getMedicines(): Promise<Medicine[]>;
  getMedicine(id: string): Promise<Medicine | undefined>;
  createMedicine(medicine: InsertMedicine): Promise<Medicine>;
  updateMedicine(id: string, medicine: Partial<InsertMedicine>): Promise<Medicine | undefined>;
  deleteMedicine(id: string): Promise<boolean>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;

  // Purchase Orders
  getPurchaseOrders(): Promise<PurchaseOrder[]>;
  getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined>;
  createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder>;

  // Invoices
  getInvoices(): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;

  // Notes
  getNotes(): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  deleteNote(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private medicines: Map<string, Medicine>;
  private customers: Map<string, Customer>;
  private suppliers: Map<string, Supplier>;
  private purchaseOrders: Map<string, PurchaseOrder>;
  private invoices: Map<string, Invoice>;
  private notes: Map<string, Note>;

  constructor() {
    this.medicines = new Map();
    this.customers = new Map();
    this.suppliers = new Map();
    this.purchaseOrders = new Map();
    this.invoices = new Map();
    this.notes = new Map();

    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample medicines
    const sampleMedicines = [
      {
        id: randomUUID(),
        name: "Paracetamol 500mg",
        manufacturer: "Pharma Inc.",
        stock: 150,
        category: "Analgesic",
        expiry_date: this.getFutureDate(365),
        barcode: "8901234567890",
        price: "30.00",
        cost: "15.00",
      },
      {
        id: randomUUID(),
        name: "Amoxicillin 250mg",
        manufacturer: "MediHealth",
        stock: 80,
        category: "Antibiotic",
        expiry_date: this.getFutureDate(180),
        barcode: "8902345678901",
        price: "150.00",
        cost: "95.00",
      },
      {
        id: randomUUID(),
        name: "Ibuprofen 200mg",
        manufacturer: "Pharma Inc.",
        stock: 200,
        category: "Analgesic",
        expiry_date: this.getFutureDate(45),
        barcode: "8903456789012",
        price: "50.00",
        cost: "25.00",
      },
      {
        id: randomUUID(),
        name: "Vitamin C 1000mg",
        manufacturer: "VitaLife",
        stock: 300,
        category: "Vitamin",
        expiry_date: this.getFutureDate(730),
        barcode: "8904567890123",
        price: "80.00",
        cost: "40.00",
      },
      {
        id: randomUUID(),
        name: "Aspirin 75mg",
        manufacturer: "MediHealth",
        stock: 0,
        category: "Analgesic",
        expiry_date: this.getFutureDate(300),
        barcode: "8905678901234",
        price: "20.00",
        cost: "10.00",
      },
      {
        id: randomUUID(),
        name: "Saline Solution",
        manufacturer: "Sterile Co.",
        stock: 50,
        category: "Antiseptic",
        expiry_date: this.getPastDate(10),
        barcode: "8906789012345",
        price: "60.00",
        cost: "30.00",
      },
      {
        id: randomUUID(),
        name: "Flu Vaccine",
        manufacturer: "VaxCorp",
        stock: 25,
        category: "Vaccine",
        expiry_date: this.getFutureDate(90),
        barcode: "8907890123456",
        price: "500.00",
        cost: "350.00",
      },
    ];

    sampleMedicines.forEach((med) => {
      this.medicines.set(med.id, med as Medicine);
    });
  }

  private getFutureDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split("T")[0];
  }

  private getPastDate(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split("T")[0];
  }

  // Medicines
  async getMedicines(): Promise<Medicine[]> {
    return Array.from(this.medicines.values());
  }

  async getMedicine(id: string): Promise<Medicine | undefined> {
    return this.medicines.get(id);
  }

  async createMedicine(medicine: InsertMedicine): Promise<Medicine> {
    const id = randomUUID();
    const newMedicine: Medicine = { ...medicine, id } as Medicine;
    this.medicines.set(id, newMedicine);
    return newMedicine;
  }

  async updateMedicine(id: string, medicine: Partial<InsertMedicine>): Promise<Medicine | undefined> {
    const existing = this.medicines.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...medicine } as Medicine;
    this.medicines.set(id, updated);
    return updated;
  }

  async deleteMedicine(id: string): Promise<boolean> {
    return this.medicines.delete(id);
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const newCustomer: Customer = { ...customer, id, address: customer.address || null };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...customer };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const id = randomUUID();
    const newSupplier: Supplier = { ...supplier, id };
    this.suppliers.set(id, newSupplier);
    return newSupplier;
  }

  async updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const existing = this.suppliers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...supplier };
    this.suppliers.set(id, updated);
    return updated;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    return this.suppliers.delete(id);
  }

  // Purchase Orders
  async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return Array.from(this.purchaseOrders.values()).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }

  async getPurchaseOrder(id: string): Promise<PurchaseOrder | undefined> {
    return this.purchaseOrders.get(id);
  }

  async createPurchaseOrder(po: InsertPurchaseOrder): Promise<PurchaseOrder> {
    const id = randomUUID();
    const newPO: PurchaseOrder = { ...po, id } as PurchaseOrder;
    this.purchaseOrders.set(id, newPO);
    return newPO;
  }

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const newInvoice: Invoice = { ...invoice, id } as Invoice;
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }

  // Notes
  async getNotes(): Promise<Note[]> {
    return Array.from(this.notes.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createNote(note: InsertNote): Promise<Note> {
    const id = randomUUID();
    const newNote: Note = {
      ...note,
      id,
      quantity: note.quantity || null,
      createdAt: new Date(),
    };
    this.notes.set(id, newNote);
    return newNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }
}

export const storage = new MemStorage();
