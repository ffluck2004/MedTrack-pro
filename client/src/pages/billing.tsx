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
  id: string;
  name: string;
  manufacturer?: string;
  price: number;
  cost: number;
  stock: number;
  barcode?: string;
  category?: string;
  expiry_date?: string; // backend uses expiry_date
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

  // load medicines, customers, invoices from backend on mount
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // medicines
        const mRes = await fetch("http://127.0.0.1:8000/api/medicines/", {
          credentials: "include",
        });
        const mJson = mRes.ok ? await mRes.json() : [];
        setMedicines(Array.isArray(mJson) ? mJson : []);

        // customers (fetch all - small list assumed)
        const cRes = await fetch("http://127.0.0.1:8000/api/customers/", {
          credentials: "include",
        });
        const cJson = cRes.ok ? await cRes.json() : [];
        setCustomers(Array.isArray(cJson) ? cJson : []);

        // invoices
        const iRes = await fetch("http://127.0.0.1:8000/api/invoices/", {
          credentials: "include",
        });
        const iJson = iRes.ok ? await iRes.json() : [];
        setInvoices(Array.isArray(iJson) ? iJson : []);
      } catch (err) {
        console.error("Initial load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // helper to refetch medicines (after sale)
  const refetchMedicines = async () => {
    try {
      const r = await fetch("http://127.0.0.1:8000/api/medicines/", {
        credentials: "include",
      });
      if (r.ok) {
        const j = await r.json();
        setMedicines(Array.isArray(j) ? j : []);
      }
    } catch (err) {
      console.error("Refetch medicines failed:", err);
    }
  };

  // helper to refetch invoices (after creating one)
  const refetchInvoices = async () => {
    try {
      const r = await fetch("http://127.0.0.1:8000/api/invoices/", {
        credentials: "include",
      });
      if (r.ok) {
        const j = await r.json();
        setInvoices(Array.isArray(j) ? j : []);
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
            type="button"
            variant={activeView === "create" ? "default" : "outline"}
            onClick={() => setActiveView("create")}
          >
            Create Invoice
          </Button>
          <Button
            type="button"
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
        <InvoiceHistoryView invoices={invoices} />
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

  // customer inputs (inline)
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

  // filtered medicines
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
    });
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
          return { ...i, quantity: newQty, lineTotal: round2(newQty * safeParse(i.price)) };
        })
        .filter(Boolean) as InvoiceItem[]
    );
  };

  const removeFromCart = (medicineId: string) => {
    setCart((prev) => prev.filter((i) => i.medicineId !== medicineId));
  };

  // totals (rounded)
  const subtotal = round2(cart.reduce((s, it) => s + safeParse(it.lineTotal), 0));
  const discountValue =
    discountType === "%" ? round2((subtotal * (safeParse(discount) || 0)) / 100) : round2(safeParse(discount));
  const taxAmount = round2(((subtotal - discountValue) * (safeParse(tax) || 0)) / 100);
  const total = round2(subtotal - discountValue + taxAmount);
  const totalCost = round2(cart.reduce((s, it) => s + safeParse(it.cost) * it.quantity, 0));

  // create or find customer via backend filter
  const findOrCreateCustomer = async (name: string, phone: string, address: string) => {
    try {
      const q = encodeURIComponent(phone || "");
      if (phone) {
        const r = await fetch(`http://127.0.0.1:8000/api/customers/?contact=${q}`, {
          credentials: "include",
        });
        if (r.ok) {
          const arr = await r.json();
          if (Array.isArray(arr) && arr.length > 0) {
            return arr[0]; // existing customer
          }
        }
      }

      if (!phone && name) {
        const qn = encodeURIComponent(name);
        const r2 = await fetch(`http://127.0.0.1:8000/api/customers/?name=${qn}`, {
          credentials: "include",
        });
        if (r2.ok) {
          const arr2 = await r2.json();
          if (Array.isArray(arr2) && arr2.length > 0) return arr2[0];
        }
      }

      // create new customer
      const payload = { name: name || "Walk-in", contact: phone || "", address: address || "" };
      const createRes = await fetch("http://127.0.0.1:8000/api/customers/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (createRes.ok) {
        const created = await createRes.json();
        setCustomers((prev) => {
          try {
            const exists = prev.some((c) => c.contact === created.contact && created.contact);
            if (exists) return prev;
            return [...prev, created];
          } catch {
            return prev;
          }
        });
        return created;
      } else {
        const txt = await createRes.text();
        console.error("Customer create failed:", txt);
        return { id: null, name: name || "Walk-in", contact: phone || "", address: address || "" };
      }
    } catch (err) {
      console.error("findOrCreateCustomer error:", err);
      return { id: null, name: name || "Walk-in", contact: phone || "", address: address || "" };
    }
  };

  // build invoice number: timestamp-based to avoid unique collisions
  const generateInvoiceNumber = async (): Promise<string> => {
    try {
      const stamp = Date.now();
      return `INV-${String(stamp).slice(-8)}`;
    } catch {
      return `INV-${Date.now()}`;
    }
  };

  // main create invoice flow
  // main create invoice flow (REPLACE your existing handleCreateInvoice with this)
  const handleCreateInvoice = async () => {
    console.log("handleCreateInvoice called", { customerName, customerPhone, adminName, cartLength: cart.length });

    // basic client-side guards
    if (!customerPhone.trim()) {
      if (!window.confirm("No phone provided. Continue and save customer as 'Walk-in'?")) {
        console.log("User cancelled due to no phone");
        return;
      }
    }
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

    // small helper to do fetch with timeout
    const fetchWithTimeout = async (url: string, opts: RequestInit = {}, timeoutMs = 10000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const merged = { ...opts, signal: controller.signal };
        const res = await fetch(url, merged);
        clearTimeout(id);
        return res;
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    };

    try {
      // 1) find or create customer
      let customerObj: any = null;
      try {
        if (customerPhone.trim()) {
          console.log("Looking up customer by contact:", customerPhone.trim());
          const r = await fetchWithTimeout(
            `http://127.0.0.1:8000/api/customers/?contact=${encodeURIComponent(customerPhone.trim())}`,
            { credentials: "include" },
            8000
          );
          if (r.ok) {
            const arr = await r.json();
            if (Array.isArray(arr) && arr.length > 0) {
              customerObj = arr[0];
              console.log("Found existing customer by contact:", customerObj);
            }
          } else {
            console.warn("Customer lookup returned non-ok status:", r.status);
          }
        }
      } catch (err) {
        console.error("Customer lookup failed (timeout/network):", err);
        // fallthrough: attempt creating customer below (or treat as Walk-in)
      }

      if (!customerObj) {
        // fallback: try name filter only if phone empty
        if (!customerPhone.trim() && customerName.trim()) {
          try {
            const r2 = await fetchWithTimeout(
              `http://127.0.0.1:8000/api/customers/?name=${encodeURIComponent(customerName.trim())}`,
              { credentials: "include" },
              8000
            );
            if (r2.ok) {
              const arr2 = await r2.json();
              if (Array.isArray(arr2) && arr2.length > 0) {
                customerObj = arr2[0];
                console.log("Found existing customer by name:", customerObj);
              }
            }
          } catch (err) {
            console.error("Customer name lookup failed:", err);
          }
        }
      }

      // create customer if none found
      if (!customerObj) {
        console.log("Creating new customer:", { name: customerName.trim(), contact: customerPhone.trim() });
        try {
          const createRes = await fetchWithTimeout(
            "http://127.0.0.1:8000/api/customers/",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                name: customerName.trim() || "Walk-in",
                contact: customerPhone.trim() || "",
                address: customerAddress.trim() || "",
              }),
            },
            8000
          );
          if (createRes.ok) {
            customerObj = await createRes.json();
            // locally cache unique customers - avoid duplicates by contact
            setCustomers((prev) => {
              try {
                const exists = prev.some((c) => c.contact === customerObj.contact && customerObj.contact);
                if (exists) return prev;
                return [...prev, customerObj];
              } catch {
                return prev;
              }
            });
            console.log("Customer created:", customerObj);
          } else {
            // if create failed return helpful message
            const txt = await createRes.text();
            console.error("Customer create failed:", createRes.status, txt);
            // try to parse json errors
            try {
              const parsed = JSON.parse(txt);
              const errs = Object.entries(parsed).map(([k, v]: any) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\n");
              alert("Failed to create customer:\n" + errs);
            } catch {
              alert(`Failed to create customer (status ${createRes.status}). See console for details.`);
            }
            // stop here — we can't continue without a customer id if your backend requires it
            setSaving(false);
            return;
          }
        } catch (err) {
          console.error("Create customer error:", err);
          alert("Failed to contact server to create/fetch customer. Check backend status and network.");
          setSaving(false);
          return;
        }
      }

      const customerId = customerObj?.id ?? null;
      // generate invoice number (timestamp-based unique-ish)
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

      console.log("Posting invoice payload (sanity check):", payload);

      // POST invoice with timeout
      let res;
      try {
        res = await fetchWithTimeout("http://127.0.0.1:8000/api/invoices/", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }, 12000); // 12s timeout
      } catch (err) {
        console.error("Invoice POST network/timeout error:", err);
        alert("Failed to reach server to save invoice (timeout or network). Check server and try again.");
        setSaving(false);
        return;
      }

      // handle non-ok responses
      if (!res.ok) {
        const text = await res.text();
        // try to parse JSON validation errors first
        try {
          const parsed = JSON.parse(text);
          console.error("Backend save returned validation JSON:", parsed);
          const errs = Object.entries(parsed)
            .map(([k, v]: any) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join("\n");
          alert(`Backend save failed:\n${errs}`);
        } catch {
          // not JSON — likely HTML (500) or plain text
          console.error("Backend save failed (non-JSON):", res.status, text);
          // Present a user-friendly message while logging full HTML to console
          if (res.status >= 500) {
            alert("Server error while saving invoice. Check server logs (OperationalError). See console for details.");
          } else {
            alert(`Failed to save invoice (status ${res.status}). See console for details.`);
          }
        }
        setSaving(false);
        return;
      }

      // success
      const created = await res.json();
      console.log("Invoice created successfully:", created);

      const savedInvoice: Invoice = {
        id: created.id ?? created.pk ?? created.invoice_number,
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
      };

      // bubble up
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
    } catch (err) {
      console.error("Create invoice error (unexpected):", err);
      alert("Failed to create invoice. See console for details.");
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
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") addToCart(m); }}
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
                    key={item.medicineId}
                    className="grid grid-cols-12 gap-2 items-center p-2 border-b"
                  >
                    <div className="col-span-6">
                      <div className="font-medium">{item.medicineName}</div>
                    </div>
                    <div className="col-span-2 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button className="px-2" type="button" onClick={() => updateQuantity(item.medicineId, -1)}>-</button>
                        <span className="px-2">{item.quantity}</span>
                        <button className="px-2" type="button" onClick={() => updateQuantity(item.medicineId, 1)}>+</button>
                      </div>
                    </div>
                    <div className="col-span-2 text-right">{formatINR(item.price)}</div>
                    <div className="col-span-1 text-right">{formatINR(item.lineTotal)}</div>
                    <div className="col-span-1 text-right">
                      <Button type="button" size="icon" variant="ghost" onClick={() => removeFromCart(item.medicineId)}><Trash2 className="h-4 w-4" /></Button>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (!customerName.trim() || !customerPhone.trim()) { alert("Provide name & phone"); return; }
                    (async () => {
                      try {
                        const r = await fetch(`http://127.0.0.1:8000/api/customers/?contact=${encodeURIComponent(customerPhone.trim())}`, { credentials: "include" });
                        if (r.ok) {
                          const arr = await r.json();
                          if (Array.isArray(arr) && arr.length > 0) {
                            setCustomers((prev) => {
                              const exists = prev.some((c) => c.contact === arr[0].contact && arr[0].contact);
                              if (exists) return prev;
                              return [...prev, arr[0]];
                            });
                            alert("Customer exists and loaded.");
                            return;
                          }
                        }
                        const create = await fetch("http://127.0.0.1:8000/api/customers/", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ name: customerName.trim(), contact: customerPhone.trim(), address: customerAddress.trim() || "" }),
                        });
                        if (create.ok) {
                          const created = await create.json();
                          setCustomers((prev) => {
                            const exists = prev.some((c) => c.contact === created.contact && created.contact);
                            if (exists) return prev;
                            return [...prev, created];
                          });
                          alert("Customer saved.");
                        } else {
                          const txt = await create.text();
                          console.error("Failed adding customer:", txt);
                          alert("Failed to save customer. See console.");
                        }
                      } catch (err) { console.error(err); alert("Failed to save customer. See console."); }
                    })();
                  }}
                  title="Add / create customer"
                >
                  Add
                </Button>
                <Button type="button" variant="ghost" onClick={() => (window.location.href = "/customers")} title="Open Customers page"><UserPlus className="h-4 w-4" /> Customers</Button>
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
                <button type="button" className={`py-2 rounded ${paymentMode === "Card" ? "bg-emerald-600 text-white" : "bg-slate-100"}`} onClick={() => setPaymentMode("Card")}>Card</button>
                <button type="button" className={`py-2 rounded ${paymentMode === "UPI" ? "bg-emerald-600 text-white" : "bg-slate-100"}`} onClick={() => setPaymentMode("UPI")}>UPI</button>
                <button type="button" className={`py-2 rounded ${paymentMode === "Cash" ? "bg-emerald-600 text-white" : "bg-slate-100"}`} onClick={() => setPaymentMode("Cash")}>Cash</button>
                <button type="button" className={`py-2 rounded ${paymentMode === "Split" ? "bg-emerald-600 text-white" : "bg-slate-100"}`} onClick={() => setPaymentMode("Split")}>Cash + UPI</button>
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

            <Button type="button" className="w-full mt-3" onClick={handleCreateInvoice} disabled={saving}>
              {saving ? "Saving..." : "Create Invoice"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---------------------- Invoice History View ---------------------- */
function InvoiceHistoryView(props: { invoices: Invoice[] }) {
  const { invoices } = props;
  const sorted = [...(invoices || [])].sort((a, b) => {
    const ta = new Date(a.created_at || "").getTime() || 0;
    const tb = new Date(b.created_at || "").getTime() || 0;
    return tb - ta;
  });

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
            <p className="text-sm text-muted-foreground">Recent invoices (click Print to print)</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sorted.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No invoices yet</p>
            ) : (
              sorted.map((inv) => (
                <div key={inv.id} className="border rounded-md p-4 flex justify-between items-center">
                  <div>
                    <p className="font-mono font-semibold">{inv.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">{inv.created_at ? new Date(inv.created_at).toLocaleString() : ""} {inv.customer_name ? `— ${inv.customer_name}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatINR(inv.total)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={inv.status === "Completed" ? "default" : "destructive"}>{inv.status}</Badge>
                      <Button type="button" size="sm" variant="ghost" onClick={() => handlePrint(inv)}>Print</Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
