// billing.tsx
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, ShoppingCart, UserPlus, Trash2 } from "lucide-react";

/* ----------------------------- Types ------------------------------ */
interface Medicine {
  id: number | string;
  name: string;
  manufacturer?: string;
  price: number;
  cost: number;
  stock: number;
  barcode?: string;
  category?: string;
  expiry_date?: string;
}

interface InvoiceItem {
  medicineId: string | number;
  medicineName: string;
  quantity: number;
  price: number;
  cost: number;
  lineTotal: number;
  // optional fields from backend:
  id?: number;
  returned_quantity?: number;
}

interface Invoice {
  id: number | string;
  invoice_number: string;
  date?: string;
  created_at?: string;
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
  payment_method?: any;
  status?: string;
  returned_at?: string | null;
}

/* -------------------------- Helpers ------------------------------- */
const safeParse = (v: any) => {
  const n = typeof v === "number" ? v : parseFloat(String(v || "0"));
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n: number) => Number((Number(n) || 0).toFixed(2));
const formatINR = (n: any) => {
  const num = safeParse(n);
  return `₹${num.toFixed(2)}`;
};
const todayDateTime = () => new Date().toLocaleString();
const isoNow = () => new Date().toISOString();

/* Base API root — vite proxy should forward /api -> Django */
const API_BASE = "/api";

/* -------------------------- Main Page ----------------------------- */
export default function Billing(): JSX.Element {
  const [activeView, setActiveView] = useState<"create" | "history">("create");

  // master data
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [customers, setCustomers] = useState<
    { id: number | string; name: string; contact?: string; address?: string }[]
  >([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  // initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // medicines (inventory)
        const mRes = await fetch(`${API_BASE}/medicines/`, { credentials: "include" });
        if (mRes.ok) {
          const mJson = await mRes.json();
          setMedicines(Array.isArray(mJson) ? mJson : []);
        } else {
          console.warn("Failed to load medicines:", mRes.status, await mRes.text());
        }

        // customers
        const cRes = await fetch(`${API_BASE}/customers/`, { credentials: "include" });
        if (cRes.ok) {
          const cJson = await cRes.json();
          setCustomers(Array.isArray(cJson) ? cJson : []);
        } else {
          console.warn("Failed to load customers:", cRes.status);
        }

        // invoices
        const iRes = await fetch(`${API_BASE}/invoices/`, { credentials: "include" });
        if (iRes.ok) {
          const iJson = await iRes.json();
          setInvoices(Array.isArray(iJson) ? iJson : []);
        } else {
          console.warn("Failed to load invoices:", iRes.status, await iRes.text());
        }
      } catch (err) {
        console.error("Initial load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // refetch helpers
  const refetchMedicines = async () => {
    try {
      const r = await fetch(`${API_BASE}/medicines/`, { credentials: "include" });
      if (r.ok) {
        const j = await r.json();
        setMedicines(Array.isArray(j) ? j : []);
      }
    } catch (err) {
      console.error("Refetch medicines failed:", err);
    }
  };
  const refetchInvoices = async () => {
    try {
      const r = await fetch(`${API_BASE}/invoices/`, { credentials: "include" });
      if (r.ok) {
        const j = await r.json();
        setInvoices(Array.isArray(j) ? j : []);
      } else {
        console.warn("Refetch invoices failed:", r.status, await r.text());
      }
    } catch (err) {
      console.error("Refetch invoices failed:", err);
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
          onInvoiceSaved={async (savedInvoice: Invoice) => {
            // after successful save, add locally and refetch server lists
            setInvoices((prev) => [savedInvoice, ...prev]);
            await Promise.all([refetchMedicines(), refetchInvoices()]);
          }}
        />
      ) : (
        <InvoiceHistoryView
          invoices={invoices}
          onReturnComplete={async () => {
            await Promise.all([refetchMedicines(), refetchInvoices()]);
          }}
        />
      )}
    </div>
  );
}

/* ---------------------- CreateInvoiceView ------------------------- */
function CreateInvoiceView(props: {
  medicines: Medicine[];
  customers: { id: number | string; name: string; contact?: string; address?: string }[];
  setCustomers: (c: { id: number | string; name: string; contact?: string; address?: string }[]) => void;
  onInvoiceSaved: (inv: Invoice) => void;
}) {
  const { medicines, customers, setCustomers, onInvoiceSaved } = props;

  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<InvoiceItem[]>([]);

  // customer inputs
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [adminName, setAdminName] = useState("");

  // payments
  const [discount, setDiscount] = useState("0");
  const [discountType, setDiscountType] = useState<"%" | "₹">("%");
  const [tax, setTax] = useState("5");
  const [paymentMode, setPaymentMode] = useState<"Cash" | "Card" | "UPI" | "Split">("Cash");
  const [splitCash, setSplitCash] = useState("0");
  const [splitUPI, setSplitUPI] = useState("0");

  const [saving, setSaving] = useState(false);

  // filtered medicines (only those with stock > 0, searchable)
  const filteredMedicines = useMemo(() => {
    const meds = Array.isArray(medicines) ? medicines : [];
    const q = (searchTerm || "").trim().toLowerCase();
    if (!q) return meds.filter((m) => safeParse(m.stock) > 0);
    return meds.filter((m) => {
      if (!m) return false;
      const name = (m.name || "").toLowerCase();
      const manu = (m.manufacturer || "").toLowerCase();
      const barcode = (m.barcode || "").toLowerCase();
      return name.includes(q) || manu.includes(q) || barcode.includes(q);
    }).filter((m) => safeParse(m.stock) > 0);
  }, [medicines, searchTerm]);

  // cart helpers
  const addToCart = (m: Medicine) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.medicineId === m.id);
      if (existing) {
        if (existing.quantity >= safeParse(m.stock)) return prev;
        return prev.map((i) =>
          i.medicineId === m.id
            ? { ...i, quantity: i.quantity + 1, lineTotal: round2((i.quantity + 1) * safeParse(i.price)) }
            : i
        );
      }
      const price = round2(safeParse(m.price));
      const cost = round2(safeParse(m.cost));
      return [
        ...prev,
        { medicineId: m.id, medicineName: m.name, quantity: 1, price, cost, lineTotal: price },
      ];
    });
    setSearchTerm("");
  };

  const updateQuantity = (medicineId: string | number, delta: number) => {
    const med = medicines.find((x) => x.id === medicineId);
    if (!med) return;
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.medicineId !== medicineId) return i;
          const newQty = i.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > safeParse(med.stock)) return i;
          return { ...i, quantity: newQty, lineTotal: round2(newQty * safeParse(i.price)) };
        })
        .filter(Boolean) as InvoiceItem[]
    );
  };

  const removeFromCart = (medicineId: string | number) => {
    setCart((prev) => prev.filter((i) => i.medicineId !== medicineId));
  };

  // totals (rounded)
  const subtotal = round2(cart.reduce((s, it) => s + safeParse(it.lineTotal), 0));
  const discountValue =
    discountType === "%" ? round2((subtotal * (safeParse(discount) || 0)) / 100) : round2(safeParse(discount));
  const taxAmount = round2(((subtotal - discountValue) * (safeParse(tax) || 0)) / 100);
  const total = round2(subtotal - discountValue + taxAmount);
  const totalCost = round2(cart.reduce((s, it) => s + safeParse(it.cost) * it.quantity, 0));

  // find or create customer using backend filters (avoid duplicates)
  const findOrCreateCustomer = async (name: string, phone: string, address: string) => {
    try {
      if (phone) {
        const r = await fetch(`${API_BASE}/customers/?contact=${encodeURIComponent(phone)}`, { credentials: "include" });
        if (r.ok) {
          const arr = await r.json();
          if (Array.isArray(arr) && arr.length > 0) return arr[0];
        }
      }
      // fallback by name
      if (!phone && name) {
        const r2 = await fetch(`${API_BASE}/customers/?name=${encodeURIComponent(name)}`, { credentials: "include" });
        if (r2.ok) {
          const arr2 = await r2.json();
          if (Array.isArray(arr2) && arr2.length > 0) return arr2[0];
        }
      }

      // create new customer
      const payload = { name: name || "Walk-in", contact: phone || "", address: address || "" };
      const createRes = await fetch(`${API_BASE}/customers/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (createRes.ok) {
        const created = await createRes.json();
        setCustomers((prev: { id: string | number; name: string; contact?: string | undefined; address?: string | undefined }[]) => {
          const exists = prev.some((c) => c.contact === created.contact && created.contact);
          if (exists) return prev;
          return [...prev, { ...created, contact: created.contact || undefined, address: created.address || undefined }];
        });
        return created;
      } else {
        const txt = await createRes.text();
        console.error("Customer create failed:", createRes.status, txt);
        return { id: null, name: name || "Walk-in", contact: phone || "", address: address || "" };
      }
    } catch (err) {
      console.error("findOrCreateCustomer error:", err);
      return { id: null, name: name || "Walk-in", contact: phone || "", address: address || "" };
    }
  };

  // generate invoice number (timestamp-based to avoid collisions)
  const generateInvoiceNumber = async (): Promise<string> => {
    const stamp = Date.now();
    return `INV-${String(stamp).slice(-8)}`;
  };

  // create invoice flow
  const handleCreateInvoice = async () => {
    if (!adminName.trim()) {
      alert("Please enter Admin Name.");
      return;
    }
    if (cart.length === 0) {
      alert("Cart is empty.");
      return;
    }
    if (paymentMode === "Split") {
      const c = safeParse(splitCash);
      const u = safeParse(splitUPI);
      const sum = Math.round((c + u) * 100) / 100;
      if (Math.abs(sum - Math.round(total * 100) / 100) > 0.001) {
        alert("Split amounts must equal total.");
        return;
      }
    }

    setSaving(true);
    try {
      const customerObj = await findOrCreateCustomer(customerName.trim(), customerPhone.trim(), customerAddress.trim());
      const customerId = customerObj?.id ?? null;

      const invoiceNumber = await generateInvoiceNumber();
      const itemsPayload = cart.map((it) => ({
        medicine_id: it.medicineId,
        quantity: it.quantity,
        price: round2(it.price),
        cost: round2(it.cost),
        line_total: round2(it.lineTotal),
      }));

      const payload: any = {
        invoice_number: invoiceNumber,
        customer: customerId,
        // optional fields kept for compatibility
        customer_name: customerName.trim() || "",
        customer_phone: customerPhone.trim() || "",
        customer_address: customerAddress.trim() || "",
        subtotal: round2(subtotal),
        discount_value: round2(discountValue),
        tax_amount: round2(taxAmount),
        total: round2(total),
        total_cost: round2(totalCost),
        admin_name: adminName.trim(),
        payment_method: paymentMode === "Split" ? "Split" : paymentMode,
        status: "Completed",
        items: itemsPayload,
      };

      const res = await fetch(`${API_BASE}/invoices/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        let parsed = null;
        try {
          parsed = JSON.parse(errText);
        } catch {}
        console.error("Backend save failed:", parsed ?? errText);
        if (parsed) {
          const errs = Object.entries(parsed)
            .map(([k, v]: any) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("\n");
          alert(`Backend save failed:\n${errs}`);
        } else {
          alert(`Backend save failed: ${res.status}\n${errText}`);
        }
      } else {
        const created = await res.json();
        const savedInvoice: Invoice = {
          id: created.id ?? created.pk ?? invoiceNumber,
          invoice_number: created.invoice_number ?? invoiceNumber,
          created_at: created.created_at ?? new Date().toISOString(),
          items: Array.isArray(created.items)
            ? created.items.map((it: any) => ({
                medicineId: it.medicine_id ?? it.medicine ?? it.medicineId,
                medicineName: it.medicine_name ?? it.medicine_name ?? "",
                quantity: it.quantity,
                price: round2(it.price),
                cost: round2(it.cost),
                lineTotal: round2(it.line_total ?? it.lineTotal),
                id: it.id,
                returned_quantity: it.returned_quantity ?? 0,
              }))
            : cart,
          subtotal: round2(created.subtotal ?? subtotal),
          discount_value: round2(created.discount_value ?? discountValue),
          tax_amount: round2(created.tax_amount ?? taxAmount),
          total: round2(created.total ?? total),
          total_cost: round2(created.total_cost ?? totalCost),
          customer: created.customer ?? customerId,
          customer_name: created.customer_name ?? customerName,
          customer_phone: created.customer_phone ?? customerPhone,
          customer_address: created.customer_address ?? customerAddress,
          admin_name: created.admin_name ?? adminName,
          payment_method: created.payment_method ?? paymentMode,
          status: created.status ?? "Completed",
          returned_at: created.returned_at ?? null,
        };

        onInvoiceSaved(savedInvoice);

        // reset UI
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

        alert("Invoice created successfully and saved to backend.");
      }
    } catch (err) {
      console.error("Create invoice error:", err);
      alert("Failed to create invoice. Check console.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left: search + medicines + cart */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" /> Search & Add Medicine
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Type to search medicines (name / manufacturer / barcode)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-3"
            />
            <div className="max-h-72 overflow-y-auto space-y-2">
              {filteredMedicines.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">No medicines found</p>
              ) : (
                filteredMedicines.map((m) => (
                  <div
                    key={m.id}
                    className="p-2 border rounded-md flex justify-between items-center hover:bg-slate-50 cursor-pointer"
                    onClick={() => addToCart(m)}
                  >
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.manufacturer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatINR(m.price)}</p>
                      <p className="text-xs">Stock: {safeParse(m.stock)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" /> Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Cart is empty</p>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-sm text-muted-foreground px-2 py-1 border-b">
                  <div className="col-span-6">Medicine</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-1 text-right">Total</div>
                  <div className="col-span-1 text-right">Actions</div>
                </div>

                {cart.map((item) => (
                  <div
                    key={String(item.medicineId)}
                    className="grid grid-cols-12 gap-2 items-center p-2 border-b"
                  >
                    <div className="col-span-6">
                      <div className="font-medium">{item.medicineName}</div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button className="px-2" onClick={() => updateQuantity(item.medicineId, -1)}>-</button>
                        <span className="px-2">{item.quantity}</span>
                        <button className="px-2" onClick={() => updateQuantity(item.medicineId, 1)}>+</button>
                      </div>
                    </div>
                    <div className="col-span-2 text-right">{formatINR(item.price)}</div>
                    <div className="col-span-1 text-right">{formatINR(item.lineTotal)}</div>
                    <div className="col-span-1 text-right">
                      <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.medicineId)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: summary + customer inputs */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Customer</label>
              <Input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="mb-2" />
              <div className="flex gap-2">
                <Input placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                <Button variant="outline" onClick={async () => {
                  if (!customerName.trim() || !customerPhone.trim()) { alert("Provide name & phone"); return; }
                  try {
                    const r = await fetch(`${API_BASE}/customers/?contact=${encodeURIComponent(customerPhone.trim())}`, { credentials: "include" });
                    if (r.ok) {
                      const arr = await r.json();
                      if (Array.isArray(arr) && arr.length > 0) {
                        alert("Customer already exists.");
                        return;
                      }
                    }
                    const create = await fetch(`${API_BASE}/customers/`, {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: customerName.trim(), contact: customerPhone.trim(), address: customerAddress.trim() || "" }),
                    });
                    if (create.ok) {
                      const created = await create.json();
                      setCustomers((prev: { id: string | number; name: string; contact?: string | undefined; address?: string | undefined }[]) => {
                        const exists = prev.some((c) => c.contact === created.contact && created.contact);
                        if (exists) return prev;
                        return [...prev, { ...created, contact: created.contact || undefined, address: created.address || undefined }];
                      });
                      alert("Customer saved.");
                    } else {
                      const txt = await create.text();
                      console.error("Create customer failed:", create.status, txt);
                      alert("Failed to save customer.");
                    }
                  } catch (err) {
                    console.error("Create customer error:", err);
                    alert("Failed to save customer.");
                  }
                }} title="Add / create customer">Add</Button>
                <Button variant="ghost" onClick={() => (window.location.href = "/customers")} title="Open Customers page"><UserPlus className="h-4 w-4" /> Customers</Button>
              </div>
              <Input placeholder="Address (optional)" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="mt-2" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Admin Name</label>
              <Input placeholder="Admin handling sale" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
            </div>

            {/* Discount / tax */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="text-sm block">Discount</label>
                <div className="flex gap-2">
                  <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="%">%</SelectItem>
                      <SelectItem value="₹">₹</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm block">Tax (%)</label>
                <Input type="number" value={tax} onChange={(e) => setTax(e.target.value)} />
              </div>
            </div>

            {/* Payment mode */}
            <div className="mt-2">
              <label className="text-sm block mb-1">Payment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button className={`py-2 rounded ${paymentMode === "Card" ? "bg-emerald-600 text-white" : "bg-slate-100"}`} onClick={() => setPaymentMode("Card")}>Card</button>
                <button className={`py-2 rounded ${paymentMode === "UPI" ? "bg-emerald-600 text-white" : "bg-slate-100"}`} onClick={() => setPaymentMode("UPI")}>UPI</button>
                <button className={`py-2 rounded ${paymentMode === "Cash" ? "bg-emerald-600 text-white" : "bg-slate-100"}`} onClick={() => setPaymentMode("Cash")}>Cash</button>
                <button className={`py-2 rounded ${paymentMode === "Split" ? "bg-emerald-600 text-white" : "bg-slate-100"}`} onClick={() => setPaymentMode("Split")}>Cash + UPI</button>
              </div>

              {paymentMode === "Split" && (
                <div className="mt-2 p-2 border rounded">
                  <label className="text-xs">Enter Split Amounts</label>
                  <Input placeholder="Cash paid" value={splitCash} onChange={(e) => setSplitCash(e.target.value)} className="mb-2" />
                  <Input placeholder="UPI paid" value={splitUPI} onChange={(e) => setSplitUPI(e.target.value)} />
                  <div className="text-xs text-rose-600 mt-1">Amounts must sum to total: {formatINR(total)}</div>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between"><span>Subtotal:</span><span>{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span>Discount:</span><span>{formatINR(discountValue)}</span></div>
              <div className="flex justify-between"><span>Tax:</span><span>{formatINR(taxAmount)}</span></div>
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total:</span><span>{formatINR(total)}</span></div>
            </div>

            <Button className="w-full mt-3" onClick={handleCreateInvoice} disabled={saving}>
              {saving ? "Saving..." : "Create Invoice"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------- Invoice History View ---------------------- */
function InvoiceHistoryView(props: {
  invoices: Invoice[];
  onReturnComplete?: () => Promise<void>;
}) {
  const { invoices, onReturnComplete } = props;
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  useEffect(() => {
    // ensure latest invoice selected is fresh when invoices prop changes
    if (selectedInvoice) {
      const fresh = invoices.find((inv) => String(inv.id) === String(selectedInvoice.id));
      if (fresh) setSelectedInvoice(fresh);
    }
  }, [invoices]);

  const sorted = [...(invoices || [])].sort((a, b) => {
    const ta = new Date(a.created_at || "").getTime() || 0;
    const tb = new Date(b.created_at || "").getTime() || 0;
    return tb - ta;
  });

  // open view modal
  const handleView = (inv: Invoice) => {
    if (!inv) {
      alert("Invoice data is missing.");
      return;
    }
    setSelectedInvoice(inv);
    setViewOpen(true);
  };

  // print helper
  const handlePrint = (inv: Invoice) => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    const style = `<style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #ddd}.right{text-align:right}</style>`;
    const rows = (inv.items || [])
      .map((it: any) => `<tr><td>${it.medicineName}</td><td class="right">${it.quantity}</td><td class="right">₹${safeParse(it.price).toFixed(2)}</td><td class="right">₹${safeParse(it.lineTotal).toFixed(2)}</td></tr>`)
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8">${style}</head><body><h2>Invoice ${inv.invoice_number}</h2><div>${inv.created_at || ""}</div><div>Customer: ${inv.customer_name || "Walk-in"}</div><table><thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Total</th></tr></thead><tbody>${rows}</tbody></table><div style="text-align:right;margin-top:12px">Total: ₹${safeParse(inv.total).toFixed(2)}</div></body></html>`;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>Invoice History</CardTitle>
            <p className="text-sm text-muted-foreground">Recent invoices (View to preview / Return to restock)</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sorted.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No invoices yet</p>
            ) : (
              sorted.map((inv) => (
                <div key={String(inv.id)} className="border rounded-md p-4 flex justify-between items-center">
                  <div>
                    <p className="font-mono font-semibold">{inv.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">{inv.created_at ? new Date(inv.created_at).toLocaleString() : ""} {inv.customer_name ? `— ${inv.customer_name}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatINR(inv.total)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={inv.status === "Completed" ? "default" : "destructive"}>{inv.status}</Badge>
                      <Button size="sm" variant="ghost" onClick={() => handleView(inv)}>View</Button>
                      <Button size="sm" variant="ghost" onClick={() => handlePrint(inv)}>Print</Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* View / Return modal */}
      <Dialog open={viewOpen} onOpenChange={(o) => { 
        if (!o) setSelectedInvoice(null); 
        setViewOpen(o); 
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedInvoice ? `Invoice ${selectedInvoice.invoice_number}` : "Invoice"}
            </DialogTitle>
          </DialogHeader>

          {selectedInvoice ? (
            <div className="p-4">
              <div className="text-center mb-4">
                <div>Customer: {selectedInvoice.customer_name ? `${selectedInvoice.customer_name} (${selectedInvoice.customer_phone || ""})` : "Walk-in"}</div>
                <div>Admin: {selectedInvoice.admin_name || "-"}</div>
                <div>Payment: {selectedInvoice.payment_method || "-"}</div>
                <div>Created: {selectedInvoice.created_at ? new Date(selectedInvoice.created_at).toLocaleString() : ""}</div>
                {selectedInvoice.status !== "Completed" && selectedInvoice.returned_at && (
                  <div className="text-sm text-rose-600">Returned — {new Date(selectedInvoice.returned_at).toLocaleString()}</div>
                )}
              </div>

              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th>Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-center">Returned</th>
                    <th className="text-right">Return</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(selectedInvoice?.items) && selectedInvoice.items.length > 0
                    ? selectedInvoice.items.map((it, idx) => {
                        const already = safeParse(it.returned_quantity || 0);
                        const maxReturnable = Math.max(0, safeParse(it.quantity) - already);

                        return (
                          <ReturnRow
                            key={idx}
                            item={it}
                            maxReturnable={maxReturnable}
                          />
                        );
                      })
                    : (
                      <tr>
                        <td colSpan={5} className="text-center text-muted-foreground py-4">
                          No items found for this invoice.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>

              <div className="flex justify-end gap-2 mt-4">
                <ReturnSelectedButton
                  invoice={selectedInvoice}
                  onDone={async (ok: boolean) => {
                    setViewOpen(false);
                    if (onReturnComplete) await onReturnComplete();
                  }}
                />
                <Button variant="outline" onClick={() => { setViewOpen(false); setSelectedInvoice(null); }}>Close</Button>
              </div>
            </div>
          ) : (
            <div className="p-4">Loading...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------- Return helpers (small components) ------------------ */
/**
 * ReturnRow: displays a row and manages per-row desiredReturn state in DOM (data-return attr)
 * We keep a data attribute on the row so ReturnSelectedButton can query them without lifting state.
 */
function ReturnRow({ item, maxReturnable }: { item: InvoiceItem; maxReturnable: number }) {
  const [desired, setDesired] = useState<number>(0);

  useEffect(() => {
    // Update the `data-return` attribute on the row
    const row = document.querySelector(`[data-invoice-item-id="${item.id}"]`);
    if (row) {
      row.setAttribute("data-return", String(desired));
    }
  }, [desired, item.id]);

  return (
    <tr data-invoice-item-id={item.id} data-return={String(desired)}>
      <td style={{ padding: "8px 6px" }}>{item.medicineName}</td>
      <td className="text-center">{item.quantity}</td>
      <td className="text-right">{formatINR(item.price)}</td>
      <td className="text-center">{item.returned_quantity ?? 0}</td>
      <td className="text-right">
        <div className="inline-flex items-center gap-2">
          <button
            onClick={() => setDesired((d) => Math.max(0, d - 1))}
            className="px-2"
          >
            -
          </button>
          <div style={{ minWidth: 28, textAlign: "center" }}>{desired}</div>
          <button
            onClick={() => setDesired((d) => Math.min(maxReturnable, d + 1))}
            className="px-2"
          >
            +
          </button>
        </div>
      </td>
    </tr>
  );
}

/**
 * ReturnSelectedButton:
 * - Reads all rows' data-return attributes
 * - Builds payload: [{ invoice_item_id, quantity }]
 * - Calls POST /api/invoices/{invoice_id}/return/ (expects backend action)
 * - FALLBACK: if that endpoint fails, patches invoice items and medicines individually
 */
function ReturnSelectedButton({ invoice, onDone }: { invoice: Invoice; onDone?: (ok: boolean) => void }) {
  const [busy, setBusy] = useState(false);

  const handleReturn = async () => {
    if (!invoice) {
      alert("Invoice data is missing.");
      return;
    }

    // Gather rows with valid attributes
    const rows = Array.from(document.querySelectorAll(`[data-invoice-item-id]`)) as HTMLElement[];
    const itemsToReturn: { invoice_item_id: number; quantity: number }[] = [];

    for (const row of rows) {
      const invId = row.getAttribute("data-invoice-item-id");
      const ret = row.getAttribute("data-return") || "0";
      const qty = Math.max(0, Math.floor(Number(ret)));

      if (invId && qty > 0) {
        itemsToReturn.push({ invoice_item_id: Number(invId), quantity: qty });
      }
    }

    if (itemsToReturn.length === 0) {
      alert("No items selected for return.");
      return;
    }

    if (!window.confirm("Confirm return for selected items?")) return;

    setBusy(true);
    try {
      // Call server return action
      const res = await fetch(`${API_BASE}/invoices/${invoice.id}/return/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToReturn }),
      });

      if (res.ok) {
        alert("Return successful.");
        if (onDone) await onDone(true);
      } else {
        const errorText = await res.text();
        console.error("Return failed:", res.status, errorText);
        alert(`Return failed: ${errorText}`);
      }
    } catch (err) {
      console.error("Return error:", err);
      alert("An error occurred while processing the return.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={handleReturn} disabled={busy}>
      {busy ? "Returning..." : "Return selected"}
    </Button>
  );
}
