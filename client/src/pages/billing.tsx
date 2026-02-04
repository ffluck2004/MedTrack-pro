// src/pages/billing.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ShoppingCart, Trash2, UserPlus } from "lucide-react";

import { useQueryClient } from "@tanstack/react-query"; // ⭐ ADDED
import { useLocation } from "wouter";
/* ----------------------------------------------------------
   API CONFIG & HELPERS
---------------------------------------------------------- */

const API_BASE = "http://127.0.0.1:8000/api";

async function fetchJSON<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

const safeParse = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
  return Number.isFinite(n) ? n : 0;
};

const round2 = (n: number): number => Number((Number(n) || 0).toFixed(2));

const formatINR = (n: unknown): string => {
  const num = safeParse(n);
  return `₹${num.toFixed(2)}`;
};
const cleanCustomerName = (value: string) => {
  // allow letters + space + dot
  return value.replace(/[^a-zA-Z.\s]/g, "");
};

const cleanPhone = (value: string) => {
  // digits only, max 10
  return value.replace(/\D/g, "").slice(0, 10);
};


/* ----------------------------------------------------------
   DOMAIN TYPES
---------------------------------------------------------- */

interface Medicine {
  id: string;
  name: string;
  manufacturer?: string;
  price: number;
  cost: number;
  stock: number;
  barcode?: string;
  category?: string;
  expiry_date?: string | null;
}

interface InvoiceItem {
  id?: number | string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  cost: number;
  lineTotal: number;
  returned_quantity?: number;
}

interface Invoice {
  id: string | number;
  invoice_number: string;
  created_at?: string | null;
  items: InvoiceItem[];
  subtotal: number;
  discount_value: number;
  tax_amount: number;
  total: number;
  total_cost: number;
  customer?: number | null;
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  admin_name?: string;
  payment_method?: string;
  status?: string;
  returned_at?: string | null;
}

interface Customer {
  id: number | string;
  name: string;
  contact?: string;
  address?: string;
}

type PaymentMode = "Cash" | "Card" | "UPI" | "Split";

/* ----------------------------------------------------------
   NORMALIZERS
---------------------------------------------------------- */

const normalizeMedicine = (m: any): Medicine => ({
  id: String(m.id),
  name: m.name ?? "",
  manufacturer: m.manufacturer ?? "",
  category: m.category ?? "Other",
  stock: safeParse(m.stock),
  price: safeParse(m.price),
  cost: safeParse(m.cost),
  barcode: m.barcode ?? "",
  expiry_date: m.expiry_date ?? null,
});

const normalizeInvoice = (inv: any): Invoice => ({
  id: inv.id ?? inv.pk ?? inv.invoice_number,
  invoice_number: inv.invoice_number ?? "",
  created_at: inv.created_at ?? null,
  items: Array.isArray(inv.items)
    ? inv.items.map(
      (it: any): InvoiceItem => ({
        id: it.id,
        medicineId: String(it.medicine_id ?? it.medicine ?? it.medicineId),
        medicineName: it.medicine_name ?? "",
        quantity: safeParse(it.quantity),
        price: round2(safeParse(it.price)),
        cost: round2(safeParse(it.cost)),
        lineTotal: round2(safeParse(it.line_total ?? it.lineTotal)),
        returned_quantity: safeParse(it.returned_quantity ?? 0),
      })
    )
    : [],
  subtotal: round2(safeParse(inv.subtotal)),
  discount_value: round2(safeParse(inv.discount_value)),
  tax_amount: round2(safeParse(inv.tax_amount)),
  total: round2(safeParse(inv.total)),
  total_cost: round2(safeParse(inv.total_cost)),
  customer: inv.customer ?? null,
  customer_name: inv.customer_name ?? "",
  customer_phone: inv.customer_phone ?? "",
  customer_address: inv.customer_address ?? "",
  admin_name: inv.admin_name ?? "",
  payment_method: inv.payment_method ?? "",
  status: inv.status ?? "Completed",
  returned_at: inv.returned_at ?? null,
});

/* ----------------------------------------------------------
   MAIN BILLING PAGE
---------------------------------------------------------- */

export default function Billing(): JSX.Element {
  const [activeView, setActiveView] = useState<"create" | "history">("create");

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const queryClient = useQueryClient(); // ⭐ ADDED

  useEffect(() => {
    const loadAll = async () => {
      try {
        const meds = await fetchJSON<any[]>("/medicines/");
        setMedicines((meds || []).map(normalizeMedicine));

        const custs = await fetchJSON<any[]>("/customers/");
        setCustomers(
          (custs || []).map((c: any) => ({
            id: c.id,
            name: c.name ?? "",
            contact: c.contact ?? "",
            address: c.address ?? "",
          }))
        );

        setLoadingInvoices(true);
        const invs = await fetchJSON<any[]>("/invoices/");
        setInvoices((invs || []).map(normalizeInvoice));
      } catch (err) {
        console.error("Initial load error:", err);
      } finally {
        setLoadingInvoices(false);
      }
    };

    loadAll();
  }, []);

  const refetchMedicines = async () => {
    try {
      const meds = await fetchJSON<any[]>("/medicines/");
      setMedicines((meds || []).map(normalizeMedicine));
    } catch (err) {
      console.error("Refetch medicines failed:", err);
    }
  };

  const refetchInvoices = async () => {
    try {
      setLoadingInvoices(true);
      const invs = await fetchJSON<any[]>("/invoices/");
      setInvoices((invs || []).map(normalizeInvoice));
    } catch (err) {
      console.error("Refetch invoices failed:", err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Billing</h1>
        <div className="flex gap-2">
          <Button
            variant={activeView === "create" ? "default" : "outline"}
            onClick={() => setActiveView("create")}
          >
            Create Invoice
          </Button>
          <Button
            variant={activeView === "history" ? "default" : "outline"}
            onClick={() => setActiveView("history")}
          >
            Invoice History
          </Button>
        </div>
      </div>

      {activeView === "create" ? (
        <CreateInvoiceView
          medicines={medicines}
          customers={customers}
          setCustomers={setCustomers}
          onInvoiceSaved={async (saved) => {
            setInvoices((prev) => [saved, ...prev]);

            await Promise.all([refetchMedicines(), refetchInvoices()]);

            // ⭐ ADDED — trigger dashboard refresh
            queryClient.invalidateQueries(["medicines"]);
            queryClient.invalidateQueries(["invoices"]);
          }}
        />
      ) : (
        <InvoiceHistoryView invoices={invoices} loading={loadingInvoices} />
      )}
    </div>
  );
}

/* ----------------------------------------------------------
   CREATE INVOICE VIEW
---------------------------------------------------------- */

function CreateInvoiceView(props: {

  medicines: Medicine[];
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  onInvoiceSaved: (inv: Invoice) => void;
}) {
  const { medicines, setCustomers, onInvoiceSaved } = props;

  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<InvoiceItem[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const [adminName, setAdminName] = useState("");

  const [discount, setDiscount] = useState("0");
  const [discountType, setDiscountType] = useState<"%" | "₹">("%");
  const [tax, setTax] = useState("5");

  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [splitCash, setSplitCash] = useState("0");
  const [splitUPI, setSplitUPI] = useState("0");

  const [saving, setSaving] = useState(false);
  const [, setLocation] = useLocation(); // ✅ ADD HERE

  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");


  const filteredMedicines = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return medicines.filter((m) => safeParse(m.stock) > 0);

    return medicines.filter((m) => {
      const name = (m.name || "").toLowerCase();
      const manu = (m.manufacturer || "").toLowerCase();
      const barcode = (m.barcode || "").toLowerCase();
      return name.includes(q) || manu.includes(q) || barcode.includes(q);
    });
  }, [medicines, searchTerm]);

  const addToCart = (m: Medicine) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.medicineId === m.id);
      if (existing) {
        if (existing.quantity >= safeParse(m.stock)) return prev;
        const newQty = existing.quantity + 1;
        return prev.map((i) =>
          i.medicineId === m.id
            ? { ...i, quantity: newQty, lineTotal: round2(newQty * i.price) }
            : i
        );
      }

      return [
        ...prev,
        {
          medicineId: m.id,
          medicineName: m.name,
          quantity: 1,
          price: round2(m.price),
          cost: round2(m.cost),
          lineTotal: round2(m.price),
        },
      ];
    });
    setSearchTerm("");
  };

  const updateQuantity = (medicineId: string, delta: number) => {
    const med = medicines.find((x) => x.id === medicineId);
    if (!med) return;

    setCart((prev) =>
      prev
        .map((i) => {
          if (i.medicineId !== medicineId) return i;
          const newQty = i.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > safeParse(med.stock)) return i;
          return { ...i, quantity: newQty, lineTotal: round2(newQty * i.price) };
        })
        .filter(Boolean) as InvoiceItem[]
    );
  };

  const removeFromCart = (medicineId: string) => {
    setCart((prev) => prev.filter((i) => i.medicineId !== medicineId));
  };

  const subtotal = round2(
    cart.reduce((sum, it) => sum + safeParse(it.lineTotal), 0)
  );

  const discountValue =
    discountType === "%"
      ? round2((subtotal * safeParse(discount)) / 100)
      : round2(safeParse(discount));

  const taxAmount = round2(((subtotal - discountValue) * safeParse(tax)) / 100);
  const total = round2(subtotal - discountValue + taxAmount);

  const totalCost = round2(
    cart.reduce((sum, it) => sum + safeParse(it.cost) * it.quantity, 0)
  );

  const findOrCreateCustomer = async (
    name: string,
    phone: string,
    address: string
  ): Promise<Customer> => {
    try {
      if (phone) {
        const byPhone = await fetchJSON<any[]>(
          `/customers/?contact=${encodeURIComponent(phone)}`
        );
        if (byPhone.length > 0) return byPhone[0];
      }

      if (!phone && name) {
        const byName = await fetchJSON<any[]>(
          `/customers/?name=${encodeURIComponent(name)}`
        );
        if (byName.length > 0) return byName[0];
      }

      const created = await fetchJSON<any>("/customers/", {
        method: "POST",
        body: JSON.stringify({
          name: name || "Walk-in",
          contact: phone || "",
          address: address || "",
        }),
      });

      const customer: Customer = {
        id: created.id,
        name: created.name,
        contact: created.contact,
        address: created.address,
      };

      setCustomers((prev) => [...prev, customer]);
      return customer;
    } catch {
      return {
        id: Date.now(),
        name: name || "Walk-in",
        contact: phone || "",
        address,
      };
    }
  };

  const generateInvoiceNumber = () =>
    `INV-${Date.now().toString().slice(-8)}`;

  const handleCreateInvoice = async () => {
    const phone = customerPhone.trim();
    const name = customerName.trim();

    if (phone && phone.length !== 10) {
      return alert("Phone number must be exactly 10 digits.");
    }

    if (name && name.length < 4) {
      return alert("Customer name must be at least 4 letters.");
    }

    if (!adminName.trim()) return alert("Enter Admin Name.");
    if (cart.length === 0) return alert("Cart is empty.");

    if (paymentMode === "Split") {
      const sum = safeParse(splitCash) + safeParse(splitUPI);
      if (Math.abs(sum - total) > 0.01)
        return alert("Split must equal total.");
    }

    setSaving(true);

    try {
      const customerObj = await findOrCreateCustomer(
        customerName.trim() || "Walk-in",
        customerPhone.trim(),
        customerAddress.trim()
      );

      const payload = {
        invoice_number: generateInvoiceNumber(),
        customer: customerObj.id,
        subtotal,
        discount_value: discountValue,
        tax_amount: taxAmount,
        total,
        total_cost: totalCost,
        admin_name: adminName.trim(),
        payment_method: paymentMode,
        status: "Completed",
        items: cart.map((it) => ({
          medicine_id: it.medicineId,
          quantity: it.quantity,
          price: it.price,
          cost: it.cost,
          line_total: it.lineTotal,
        })),
      };

      const created = await fetchJSON<any>("/invoices/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      onInvoiceSaved(normalizeInvoice(created));

      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setAdminName("");
      setDiscount("0");
      setDiscountType("%");
      setTax("5");
      setPaymentMode("Cash");
      setSplitCash("0");
      setSplitUPI("0");

      alert("Invoice created successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to create invoice.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* LEFT */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" /> Search & Add Medicine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3"
            />
            <div className="max-h-72 overflow-y-auto space-y-2">
              {filteredMedicines.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No medicines found
                </p>
              ) : (
                filteredMedicines.map((m) => (
                  <div
                    key={m.id}
                    className="p-2 border rounded-md flex justify-between cursor-pointer hover:bg-slate-50"
                    onClick={() => addToCart(m)}
                  >
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.manufacturer}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatINR(m.price)}</p>
                      <p className="text-xs">Stock: {m.stock}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Cart ({cart.length})
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Cart is empty
              </p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-sm text-muted-foreground px-2 py-1 border-b">
                  <div className="col-span-6">Medicine</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-1 text-right">Total</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>

                {cart.map((item) => (
                  <div
                    key={item.medicineId}
                    className="grid grid-cols-12 gap-2 items-center p-2 border-b"
                  >
                    <div className="col-span-6 font-medium">
                      {item.medicineName}
                    </div>

                    <div className="col-span-2 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          className="px-2"
                          onClick={() => updateQuantity(item.medicineId, -1)}
                        >
                          -
                        </button>
                        <span className="px-2">{item.quantity}</span>
                        <button
                          className="px-2"
                          onClick={() => updateQuantity(item.medicineId, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="col-span-2 text-right">
                      {formatINR(item.price)}
                    </div>

                    <div className="col-span-1 text-right">
                      {formatINR(item.lineTotal)}
                    </div>

                    <div className="col-span-1 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromCart(item.medicineId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT SIDE */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Customer */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Customer
              </label>
              <Input
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomerName(val);

                  if (/\d/.test(val)) {
                    setNameError("Customer name cannot contain numbers");
                  } else {
                    setNameError("");
                  }
                }}
                className={nameError ? "border-red-500" : ""}
              />

              {nameError && (
                <p className="text-xs text-red-500 mt-1">{nameError}</p>
              )}

              <div className="flex gap-4 mt-2">
                <Input
                  placeholder="Phone"
                  value={customerPhone}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomerPhone(val);

                    if (!/^\d*$/.test(val)) {
                      setPhoneError("Only digits allowed");
                    } else if (val.length > 10) {
                      setPhoneError("Phone number cannot exceed 10 digits");
                    } else if (val.length > 0 && val.length < 10) {
                      setPhoneError("Phone number must be 10 digits");
                    } else {
                      setPhoneError("");
                    }
                  }}
                  className={phoneError ? "border-red-500" : ""}
                />

                {phoneError && (
                  <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                )}

                <Button
                  variant="outline"
                  type="button"
                  onClick={async () => {
                    if (!customerName.trim() || !customerPhone.trim()) {
                      return alert("Provide name & phone");
                    }

                    try {
                      const created = await fetchJSON<any>("/customers/", {
                        method: "POST",
                        body: JSON.stringify({
                          name: customerName.trim(),
                          contact: customerPhone.trim(),
                          address: customerAddress.trim(),
                        }),
                      });

                      setCustomers((prev) => [
                        ...prev,
                        {
                          id: created.id,
                          name: created.name,
                          contact: created.contact,
                          address: created.address,
                        },
                      ]);

                      alert("Customer saved.");
                    } catch (err) {
                      alert("Failed to save customer.");
                    }
                  }}
                >
                  Add
                </Button>

                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => setLocation("/customers")}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>

              </div>

              <Input
                placeholder="Address (optional)"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Admin */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Admin Name
              </label>
              <Input
                placeholder="Admin handling sale"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
            </div>

            {/* Discount & Tax */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="text-sm block">Discount</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                  <Select
                    value={discountType}
                    onValueChange={(v) => setDiscountType(v as "%" | "₹")}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="%">%</SelectItem>
                      <SelectItem value="₹">₹</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm block">Tax (%)</label>
                <Input
                  type="number"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Mode */}
            <div className="mt-2">
              <label className="text-sm block mb-1">Payment Mode</label>

              <div className="grid grid-cols-2 gap-2">
                {["Card", "UPI", "Cash", "Split"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={`py-2 rounded ${paymentMode === mode
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100"
                      }`}
                    onClick={() => setPaymentMode(mode as PaymentMode)}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {paymentMode === "Split" && (
                <div className="mt-2 p-2 border rounded">
                  <label className="text-xs block mb-1">Enter amounts</label>

                  <Input
                    placeholder="Cash amount"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    className="mb-2"
                  />

                  <Input
                    placeholder="UPI amount"
                    value={splitUPI}
                    onChange={(e) => setSplitUPI(e.target.value)}
                  />

                  <div className="text-xs text-red-500 mt-1">
                    Must equal: {formatINR(total)}
                  </div>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="border-t pt-2 space-y-1 mt-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatINR(subtotal)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Discount:</span>
                <span>{formatINR(discountValue)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>{formatINR(taxAmount)}</span>
              </div>

              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>

            <Button
              className="w-full mt-3"
              disabled={saving}
              onClick={handleCreateInvoice}
            >
              {saving ? "Saving..." : "Create Invoice"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div >
  );
}

/* ----------------------------------------------------------
   INVOICE HISTORY VIEW
---------------------------------------------------------- */

function InvoiceHistoryView(props: { invoices: Invoice[]; loading: boolean }) {
  const { invoices, loading } = props;

  const sorted = [...invoices].sort((a, b) => {
    return (
      new Date(b.created_at || "").getTime() -
      new Date(a.created_at || "").getTime()
    );
  });

  const handlePrint = (inv: Invoice) => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;

    const style = `
      <style>
        body { font-family: Arial; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { padding: 8px; border-bottom: 1px solid #ddd; }
        .right { text-align: right; }
      </style>
    `;

    const rows = inv.items
      .map(
        (it) => `
      <tr>
        <td>${it.medicineName}</td>
        <td class="right">${it.quantity}</td>
        <td class="right">${formatINR(it.price)}</td>
        <td class="right">${formatINR(it.lineTotal)}</td>
      </tr>
    `
      )
      .join("");

    w.document.write(`
      <html>
        <head>${style}</head>
        <body>
          <h2>Invoice ${inv.invoice_number}</h2>
          <div>${new Date(inv.created_at || "").toLocaleString()}</div>
          <div>Customer: ${inv.customer_name || "Walk-in"}</div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="right">Qty</th>
                <th class="right">Price</th>
                <th class="right">Total</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="text-align:right;margin-top:12px;">
            <strong>Total: ${formatINR(inv.total)}</strong>
          </div>
        </body>
      </html>
    `);

    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice History</CardTitle>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-6">
            Loading invoices...
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sorted.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No invoices yet
              </p>
            ) : (
              sorted.map((inv) => (
                <div
                  key={String(inv.id)}
                  className="border rounded-md p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-mono font-semibold">{inv.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {inv.created_at
                        ? new Date(inv.created_at).toLocaleString()
                        : ""}{" "}
                      — {inv.customer_name || "Walk-in"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">{formatINR(inv.total)}</p>

                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={
                          inv.status === "Completed" ? "default" : "destructive"
                        }
                      >
                        {inv.status}
                      </Badge>

                      <Button size="sm" variant="ghost" onClick={() => handlePrint(inv)}>
                        Print
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
