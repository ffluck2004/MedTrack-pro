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
import { Search, Plus, Minus, Trash2, ShoppingCart, UserPlus } from "lucide-react";

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
  expiryDate?: string;
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
  date: string; // human-readable date/time
  createdAt: string; // ISO
  items: InvoiceItem[];
  subtotal: number;
  discountValue: number;
  taxAmount: number;
  total: number;
  totalCost: number;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  adminName?: string;
  paymentMethod: "Cash" | "Card" | "UPI" | { cash: number; upi: number };
  status: "Completed" | "Returned";
}

type PaymentMode = "Cash" | "Card" | "UPI" | "Split";

/* -------------------------- Helpers ------------------------------- */
const safeParse = (v: any) => {
  const n = typeof v === "number" ? v : parseFloat(String(v || "0"));
  return Number.isFinite(n) ? n : 0;
};
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
    { id: string; name: string; phone?: string; address?: string }[]
  >([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);


// load medicines live from backend + customers/invoices from localStorage
useEffect(() => {
  const loadData = async () => {
    try {
      // ✅ fetch live medicines from Django API
      const res = await fetch("http://127.0.0.1:8000/api/medicines/");
      const data = await res.json();
      setMedicines(Array.isArray(data) ? data : []);

      // ✅ keep your local customers and invoices
      const rawCust = localStorage.getItem("customers") || "[]";
      const parsedCust = JSON.parse(rawCust || "[]");
      const custs = Array.isArray(parsedCust) ? parsedCust : [];

      const rawInv = localStorage.getItem("invoices") || "[]";
      const parsedInv = JSON.parse(rawInv || "[]");
      const invs = Array.isArray(parsedInv) ? parsedInv : [];

      setCustomers(custs);
      setInvoices(invs);
    } catch (err) {
      console.error("Failed fetching live medicines:", err);
      setMedicines([]);
      setCustomers([]);
      setInvoices([]);
    }
  };
  loadData();
}, []);


  // persist changes
  useEffect(() => {
    try {
      localStorage.setItem("medicines", JSON.stringify(medicines));
    } catch {}
  }, [medicines]);
  useEffect(() => {
    try {
      localStorage.setItem("customers", JSON.stringify(customers));
    } catch {}
  }, [customers]);
  useEffect(() => {
    try {
      localStorage.setItem("invoices", JSON.stringify(invoices));
    } catch {}
  }, [invoices]);

  const handleAddInvoice = (inv: Invoice) => {
    setInvoices((prev) => [inv, ...prev]);
  };

  const handleSetMedicines = (m: Medicine[]) => setMedicines(m);
  const handleSetCustomers = (c: typeof customers) => setCustomers(c);

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
          setMedicines={handleSetMedicines}
          setCustomers={handleSetCustomers}
          onAddInvoice={handleAddInvoice}
        />
      ) : (
        <InvoiceHistoryView
          invoices={invoices}
          setInvoices={setInvoices}
          medicines={medicines}
          setMedicines={setMedicines}
        />
      )}
    </div>
  );
}

/* ---------------------- CreateInvoiceView ------------------------- */
function CreateInvoiceView(props: {
  medicines: Medicine[];
  customers: { id: string; name: string; phone?: string; address?: string }[];
  setMedicines: (m: Medicine[]) => void;
  setCustomers: (c: { id: string; name: string; phone?: string; address?: string }[]) => void;
  onAddInvoice: (inv: Invoice) => void;
}) {
  const { medicines, customers, setMedicines, setCustomers, onAddInvoice } = props;

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
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("Cash");
  const [splitCash, setSplitCash] = useState("0");
  const [splitUPI, setSplitUPI] = useState("0");

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
            ? { ...i, quantity: i.quantity + 1, lineTotal: (i.quantity + 1) * safeParse(i.price) }
            : i
        );
      }
      const price = safeParse(m.price);
      const cost = safeParse(m.cost);
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
          return { ...i, quantity: newQty, lineTotal: newQty * safeParse(i.price) };
        })
        .filter(Boolean) as InvoiceItem[]
    );
  };

  const removeFromCart = (medicineId: string) => {
    setCart((prev) => prev.filter((i) => i.medicineId !== medicineId));
  };

  // totals
  const subtotal = cart.reduce((s, it) => s + safeParse(it.lineTotal), 0);
  const discountValue =
    discountType === "%" ? (subtotal * (safeParse(discount) || 0)) / 100 : safeParse(discount);
  const taxAmount = ((subtotal - discountValue) * (safeParse(tax) || 0)) / 100;
  const total = subtotal - discountValue + taxAmount;
  const totalCost = cart.reduce((s, it) => s + safeParse(it.cost) * it.quantity, 0);

  // add customer button -> adds to customers list and persists
  const addCustomerToList = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Provide customer name and phone to add.");
      return;
    }
    const newCust = {
      id: crypto.randomUUID(),
      name: customerName.trim(),
      phone: customerPhone.trim(),
      address: customerAddress.trim() || undefined,
    };
    const updated = [...customers, newCust];
    setCustomers(updated);
    try {
      localStorage.setItem("customers", JSON.stringify(updated));
    } catch {}
    alert("Customer added to customers list.");
  };

  // ✅ FIXED: navigate to customers page (goToCustomers defined properly)
  const goToCustomers = () => {
    try {
      window.location.href = "/customers"; // or use wouter for smoother nav
    } catch (err) {
      console.error("Navigation error:", err);
    }
  };

  // ✅ create invoice and persist to backend + local
  const handleCreateInvoice = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Please enter customer name and phone before saving invoice.");
      return;
    }
    if (!adminName.trim()) {
      alert("Please enter Admin Name.");
      return;
    }
    if (cart.length === 0) {
      alert("Cart is empty.");
      return;
    }

    // split payment check
    if (paymentMode === "Split") {
      const c = safeParse(splitCash);
      const u = safeParse(splitUPI);
      const sum = Math.round((c + u) * 100) / 100;
      if (Math.abs(sum - Math.round(total * 100) / 100) > 0.001) {
        alert("Split amounts must equal total.");
        return;
      }
    }

    const count = Number(localStorage.getItem("invoice_count") || "0") + 1;
    const invoiceNumber = `INV-${String(count).padStart(4, "0")}`;

    const newInvoice: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber,
      date: todayDateTime(),
      createdAt: isoNow(),
      items: cart,
      subtotal,
      discountValue,
      taxAmount,
      total,
      totalCost,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim() || undefined,
      adminName: adminName.trim(),
      paymentMethod:
        paymentMode === "Split"
          ? { cash: safeParse(splitCash), upi: safeParse(splitUPI) }
          : (paymentMode as any),
      status: "Completed",
    };

    // ✅ Send to Django backend for saving

try {
  const payload = {
    invoice_number: invoiceNumber,
    customer_name: customerName.trim(),
    customer_phone: customerPhone.trim(),
    customer_address: customerAddress.trim() || "",
    subtotal,
    discount_value: discountValue,
    tax_amount: taxAmount,
    total_amount: total,
    total_cost: totalCost,
    admin_name: adminName.trim(),
    payment_method:
      paymentMode === "Split"
        ? "Split"
        : paymentMode,
    status: "Completed",
    items: cart.map((it) => ({
      medicine_id: it.medicineId,
      quantity: it.quantity,
      price: it.price,
      cost: it.cost,
      line_total: it.lineTotal,
    })),
  };

  const res = await fetch("http://127.0.0.1:8000/api/invoices/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Backend save failed:", errText);
  } else {
    console.log("✅ Invoice successfully saved to backend!");
  }
} catch (err) {
  console.error("Failed saving invoice to backend:", err);
}


    // persist invoice in local
    onAddInvoice(newInvoice);
    try {
      localStorage.setItem("invoice_count", String(count));
    } catch {}

    // update stock
    const updatedMed = medicines.map((m) => {
      const sold = cart.find((it) => it.medicineId === m.id);
      if (!sold) return m;
      return { ...m, stock: Math.max(0, safeParse(m.stock) - sold.quantity) };
    });
    setMedicines(updatedMed);
    try {
      localStorage.setItem("medicines", JSON.stringify(updatedMed));
    } catch {}

    // add new customer if needed
    const exists = customers.some((c) => c.phone === customerPhone.trim());
    if (!exists) {
      const newCust = {
        id: crypto.randomUUID(),
        name: customerName.trim(),
        phone: customerPhone.trim(),
        address: customerAddress.trim() || undefined,
      };
      const updatedCusts = [...customers, newCust];
      setCustomers(updatedCusts);
      try {
        localStorage.setItem("customers", JSON.stringify(updatedCusts));
      } catch {}
    }

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
                    key={item.medicineId}
                    className="grid grid-cols-12 gap-2 items-center p-2 border-b"
                  >
                    <div className="col-span-6">
                      <div className="font-medium">{item.medicineName}</div>
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
                    <div className="col-span-2 text-right">{formatINR(item.price)}</div>
                    <div className="col-span-1 text-right">{formatINR(item.lineTotal)}</div>
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

      {/* Right: summary + customer inputs */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Select Customer</label>
              <Input
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mb-2"
              />
              <div className="flex gap-2">
                <Input
                  placeholder="Phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <Button
                  variant="outline"
                  onClick={addCustomerToList}
                  title="Add this customer to Customers list"
                >
                  Add
                </Button>
                <Button
                  variant="ghost"
                  onClick={goToCustomers}
                  title="Open Customers page"
                >
                  <UserPlus className="h-4 w-4" /> Customers
                </Button>
              </div>
              <Input
                placeholder="Address (optional)"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Admin Name</label>
              <Input
                placeholder="Admin handling sale"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
            </div>

            {/* Discount / tax */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="text-sm block">Discount</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                    <SelectTrigger>
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

            {/* Payment mode */}
            <div className="mt-2">
              <label className="text-sm block mb-1">Payment Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`py-2 rounded ${
                    paymentMode === "Card" ? "bg-emerald-600 text-white" : "bg-slate-100"
                  }`}
                  onClick={() => setPaymentMode("Card")}
                >
                  Card
                </button>
                <button
                  className={`py-2 rounded ${
                    paymentMode === "UPI" ? "bg-emerald-600 text-white" : "bg-slate-100"
                  }`}
                  onClick={() => setPaymentMode("UPI")}
                >
                  UPI
                </button>
                <button
                  className={`py-2 rounded ${
                    paymentMode === "Cash" ? "bg-emerald-600 text-white" : "bg-slate-100"
                  }`}
                  onClick={() => setPaymentMode("Cash")}
                >
                  Cash
                </button>
                <button
                  className={`py-2 rounded ${
                    paymentMode === "Split" ? "bg-emerald-600 text-white" : "bg-slate-100"
                  }`}
                  onClick={() => setPaymentMode("Split")}
                >
                  Cash + UPI
                </button>
              </div>

              {paymentMode === "Split" && (
                <div className="mt-2 p-2 border rounded">
                  <label className="text-xs">Enter Split Amounts</label>
                  <Input
                    placeholder="Cash paid"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    className="mb-2"
                  />
                  <Input
                    placeholder="UPI paid"
                    value={splitUPI}
                    onChange={(e) => setSplitUPI(e.target.value)}
                  />
                  <div className="text-xs text-rose-600 mt-1">
                    Amounts must sum to total: {formatINR(total)}
                  </div>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>{formatINR(discountValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>{formatINR(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>{formatINR(total)}</span>
              </div>
            </div>

            <Button className="w-full mt-3" onClick={handleCreateInvoice}>
              Create Invoice
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
  setInvoices: (inv: Invoice[]) => void;
  medicines: Medicine[];
  setMedicines: (m: Medicine[]) => void;
}) {
  const { invoices, setInvoices, medicines, setMedicines } = props;
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showView, setShowView] = useState(false);

  const sorted = [...(invoices || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleReturn = (id: string) => {
  const storedInvoices = JSON.parse(localStorage.getItem("invoices") || "[]");
  const storedMedicines = JSON.parse(localStorage.getItem("medicines") || "[]");

  const updatedInvoices = storedInvoices.map((inv: any) => {
    if (inv.id === id && inv.status === "Completed") {
      // Restock medicines
      inv.items.forEach((item: any) => {
        const med = storedMedicines.find((m: any) => m.id === item.medicineId);
        if (med) med.stock += item.quantity;
      });
      return { ...inv, status: "Returned" };
    }
    return inv;
  });

  // Save updates
  localStorage.setItem("medicines", JSON.stringify(storedMedicines));
  localStorage.setItem("invoices", JSON.stringify(updatedInvoices));

  // Update UI state
  setInvoices(updatedInvoices);
  setMedicines(storedMedicines);
};


  const handleView = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setShowView(true);
  };

  const handlePrint = (inv: Invoice) => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    const style = `<style>body{font-family:Arial,Helvetica,sans-serif;padding:20px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border-bottom:1px solid #ddd}.right{text-align:right}</style>`;
    const rows = inv.items.map(it => `<tr><td>${it.medicineName}</td><td class="right">${it.quantity}</td><td class="right">₹${safeParse(it.price).toFixed(2)}</td><td class="right">₹${safeParse(it.lineTotal).toFixed(2)}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8">${style}</head><body><h2>Invoice ${inv.invoiceNumber}</h2><div>${inv.date}</div><div>Customer: ${inv.customerName || "Walk-in"}</div><table><thead><tr><th>Item</th><th class="right">Qty</th><th class="right">Price</th><th class="right">Total</th></tr></thead><tbody>${rows}</tbody></table><div style="text-align:right;margin-top:12px">Total: ₹${safeParse(inv.total).toFixed(2)}</div></body></html>`;
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
            <p className="text-sm text-muted-foreground">Recent invoices (click View to preview or Return to restock)</p>
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
                    <p className="font-mono font-semibold">{inv.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">{inv.date} {inv.customerName ? `— ${inv.customerName}` : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatINR(inv.total)}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={inv.status === "Completed" ? "default" : "destructive"}>{inv.status}</Badge>
{inv.status === "Completed" && (
  <Button size="sm" variant="ghost" onClick={() => handleReturn(inv.id)}>
    Return
  </Button>
)}
<Button size="sm" variant="ghost" onClick={() => handlePrint(inv)}>
  Print
</Button>

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
