import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Category enum
export enum Category {
  TABLET = 'Tablet',
  CAPSULE = 'Capsule',
  SYRUP = 'Syrup',
  DROPS = 'Drops',
  INJECTION = 'Injection',
  POWDER = 'Powder',
  OINTMENT = 'Ointment',
  ANALGESIC = 'Analgesic',
  ANTIBIOTIC = 'Antibiotic',
  ANTIVIRAL = 'Antiviral',
  VACCINE = 'Vaccine',
  VITAMIN = 'Vitamin',
  ANTISEPTIC = 'Antiseptic',
  OTHER = 'Other',
}

// Medicine schema
export const medicines = pgTable("medicines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  manufacturer: text("manufacturer").notNull(),
  stock: integer("stock").notNull().default(0),
  category: text("category").notNull(),
  expiry_date: text("expiry_date").notNull(), // ✅ changed key
  barcode: text("barcode").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
});


export const insertMedicineSchema = createInsertSchema(medicines).omit({ id: true });
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;
export type Medicine = typeof medicines.$inferSelect;

// Customer schema
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Supplier schema
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactPerson: text("contact_person").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true });
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Purchase Order Item interface
export interface PurchaseOrderItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  cost: number;
  totalCost: number;
}

// Purchase Order schema
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poNumber: text("po_number").notNull().unique(),
  supplierId: text("supplier_id").notNull(),
  date: text("date").notNull(),
  items: text("items").notNull(), // JSON stringified array of PurchaseOrderItem[]
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // 'Pending' | 'Completed'
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({ id: true });
export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

// Invoice Item interface
export interface InvoiceItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  cost: number;
  lineTotal: number;
}

// Invoice schema
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  date: text("date").notNull(),
  items: text("items").notNull(), // JSON stringified array of InvoiceItem[]
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).notNull(),
  customerId: text("customer_id"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  paymentMethod: text("payment_method").notNull(), // 'Cash' | 'Card' | 'UPI' | 'Split'
  cashPaid: decimal("cash_paid", { precision: 10, scale: 2 }),
  upiPaid: decimal("upi_paid", { precision: 10, scale: 2 }),
  adminName: text("admin_name").notNull(),
  status: text("status").notNull(), // 'Completed' | 'Returned'
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Note schema
export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  quantity: integer("quantity"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true });
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

// Chat Message interface
export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// Page enum for navigation
export enum Page {
  DASHBOARD = 'Dashboard',
  BILLING = 'Billing',
  CUSTOMERS = 'Customers',
  SUPPLIERS = 'Suppliers',
  PURCHASE_ORDERS = 'Purchase Orders',
  INVENTORY = 'Inventory',
  ADD_MEDICINE = 'Add Medicine',
  REPORTS = 'Reports',
  SETTINGS = 'Settings'
}
