import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Medicine, Invoice, Category } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

import {
  Package,
  AlertTriangle,
  Download,
  Filter,
  Search,
  FileText,
  Calendar,
  CheckSquare,
  Square,
} from "lucide-react";

import { apiRequest } from "@/lib/queryClient";

/* ---------------- Utils ---------------- */

const COLORS = [
  "#0D9488",
  "#14B8A6",
  "#2DD4BF",
  "#5EEAD4",
  "#99F6E4",
  "#CCFBF1",
  "#F0FDFA",
];

const formatINR = (n: number) =>
  `₹${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const isExpired = (d?: string | null) => (d ? new Date(d) < new Date() : false);

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function safeDate(x: any) {
  const d = new Date(x || "");
  return Number.isNaN(d.getTime()) ? null : d;
}

function withinRange(date: Date, start?: Date | null, end?: Date | null) {
  if (!start && !end) return true;
  if (start && date < start) return false;
  if (end) {
    const endDay = new Date(end);
    endDay.setHours(23, 59, 59, 999);
    if (date > endDay) return false;
  }
  return true;
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((x) => `"${String(x).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/* ---------------- Component ---------------- */

type RangePreset = "today" | "7d" | "30d" | "custom";

export default function Reports() {
  /* ---------------- Local state ---------------- */

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const [stockFilter, setStockFilter] = useState<
    "all" | "in" | "low" | "out" | "expired"
  >("all");

  const [rangePreset, setRangePreset] = useState<RangePreset>("30d");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  /* ---- Export selections ---- */
  const [expMedicines, setExpMedicines] = useState(true);
  const [expInvoices, setExpInvoices] = useState(false);
  const [expLowOnly, setExpLowOnly] = useState(false);
  const [expExpiredOnly, setExpExpiredOnly] = useState(false);
  const [expCompletedOnly, setExpCompletedOnly] = useState(true);

  /* ---------------- Fetch ---------------- */

  const { data: medicines = [], isLoading: medicinesLoading } =
    useQuery<Medicine[]>({
      queryKey: ["/api/medicines"],
      queryFn: async () => apiRequest("GET", "/api/medicines"),
    });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<
    Invoice[]
  >({
    queryKey: ["/api/invoices"],
    queryFn: async () => apiRequest("GET", "/api/invoices"),
  });

  const isLoading = medicinesLoading || invoicesLoading;

  /* ---------------- Date range ---------------- */

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();

    if (rangePreset === "today") {
      const s = new Date(now);
      s.setHours(0, 0, 0, 0);
      return { startDate: s, endDate: now };
    }

    if (rangePreset === "7d") {
      const s = new Date(now);
      s.setDate(s.getDate() - 7);
      return { startDate: s, endDate: now };
    }

    if (rangePreset === "30d") {
      const s = new Date(now);
      s.setDate(s.getDate() - 30);
      return { startDate: s, endDate: now };
    }

    // custom
    const s = customStart ? safeDate(customStart) : null;
    const e = customEnd ? safeDate(customEnd) : null;
    return { startDate: s, endDate: e };
  }, [rangePreset, customStart, customEnd]);

  /* ---------------- Derived data ---------------- */

  const completedInvoices = useMemo(
    () => invoices.filter((inv) => inv.status === "Completed"),
    [invoices]
  );

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const d = safeDate((inv as any).createdAt || (inv as any).created_at);
        if (!d) return true;
        return withinRange(d, startDate, endDate);
      })
      .filter((inv) => {
        if (!expCompletedOnly) return true;
        return inv.status === "Completed";
      });
  }, [invoices, startDate, endDate, expCompletedOnly]);

  const filteredMedicines = useMemo(() => {
    return medicines
      .filter((m) => {
        const s = search.trim().toLowerCase();
        if (!s) return true;
        return (
          m.name?.toLowerCase().includes(s) ||
          (m.category || "Other").toLowerCase().includes(s)
        );
      })
      .filter((m) => {
        if (filterCategory === "All") return true;
        return (m.category || "Other") === filterCategory;
      })
      .filter((m) => {
        if (stockFilter === "all") return true;
        if (stockFilter === "in") return Number(m.stock || 0) > 20;
        if (stockFilter === "low")
          return Number(m.stock || 0) > 0 && Number(m.stock || 0) <= 20;
        if (stockFilter === "out") return Number(m.stock || 0) === 0;
        if (stockFilter === "expired") return isExpired(m.expiry_date);
        return true;
      });
  }, [medicines, search, filterCategory, stockFilter]);

  const expiredMedicines = useMemo(() => {
    return filteredMedicines.filter((m) =>
      isExpired(m.expiry_date)
    );
  }, [filteredMedicines]);


  const lowStockMedicines = useMemo(() => {
    return filteredMedicines
      .filter((m) => Number(m.stock || 0) > 0 && Number(m.stock || 0) <= 20)
      .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
  }, [filteredMedicines]);


  const outOfStockMedicines = useMemo(() => {
    return filteredMedicines.filter((m) => Number(m.stock || 0) === 0);
  }, [filteredMedicines]);


  const topExpensiveMedicines = useMemo(() => {
    return [...filteredMedicines]
      .sort((a, b) => Number(b.price || 0) - Number(a.price || 0))
      .slice(0, 10);
  }, [filteredMedicines]);

  const recentInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => {
        const da = safeDate((a as any).createdAt || (a as any).created_at);
        const db = safeDate((b as any).createdAt || (b as any).created_at);
        return (db?.getTime() || 0) - (da?.getTime() || 0);
      })
      .slice(0, 10);
  }, [invoices]);

  /* ---------------- Summary cards (NOT dashboard style) ---------------- */

  const completedCount = completedInvoices.length;

  /* ---------------- Charts ---------------- */

  const categoryData = useMemo(() => {
    return Object.values(Category)
      .map((cat) => ({
        name: cat,
        value: medicines.filter((m) => m.category === cat).length,
      }))
      .filter((item) => item.value > 0);
  }, [medicines]);

  const stockData = useMemo(() => {
    return [
      {
        name: "In Stock",
        value: medicines.filter((m) => Number(m.stock || 0) > 20).length,
      },
      {
        name: "Low Stock",
        value: medicines.filter(
          (m) => Number(m.stock || 0) > 0 && Number(m.stock || 0) <= 20
        ).length,
      },
      {
        name: "Out of Stock",
        value: medicines.filter((m) => Number(m.stock || 0) === 0).length,
      },
    ];
  }, [medicines]);

  const monthlyRevenue = useMemo(() => {
    // Uses COMPLETED invoices only (correct for analytics)
    const map = new Map<string, number>();

    completedInvoices.forEach((inv) => {
      const d = safeDate((inv as any).createdAt || (inv as any).created_at);
      if (!d) return;

      // Apply date filter here also
      if (!withinRange(d, startDate, endDate)) return;

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      map.set(key, (map.get(key) || 0) + Number(inv.total || 0));
    });

    const keys = Array.from(map.keys()).sort();
    return keys.map((k) => ({
      month: k,
      total: map.get(k) || 0,
    }));
  }, [completedInvoices, startDate, endDate]);

  /* ---------------- CSV Export ---------------- */

  function runExport() {
    const blocks: string[] = [];

    if (!expMedicines && !expInvoices) {
      alert("Select at least one dataset to export.");
      return;
    }

    // Medicines CSV
    if (expMedicines) {
      const meds = medicines
        .filter((m) => {
          if (expLowOnly) return Number(m.stock || 0) > 0 && Number(m.stock || 0) <= 20;
          return true;
        })
        .filter((m) => {
          if (expExpiredOnly) return isExpired(m.expiry_date);
          return true;
        });

      const rows: (string | number)[][] = [
        ["Medicines Export"],
        ["Name", "Category", "Stock", "Price", "Expiry"],
        ...meds.map((m) => [
          m.name || "",
          m.category || "Other",
          Number(m.stock || 0),
          Number(m.price || 0),
          (m.expiry_date || "") as any,
        ]),
      ];

      blocks.push(rows.map((r) => r.join(",")).join("\n"));
    }

    // Invoices CSV
    if (expInvoices) {
      const invs = invoices
        .filter((inv) => {
          const d = safeDate((inv as any).createdAt || (inv as any).created_at);
          if (!d) return true;
          return withinRange(d, startDate, endDate);
        })
        .filter((inv) => {
          if (!expCompletedOnly) return true;
          return inv.status === "Completed";
        });

      const rows: (string | number)[][] = [
        ["Invoices Export"],
        ["Invoice No", "Status", "Total", "Created At"],
        ...invs.map((inv) => [
          (inv as any).invoiceNumber || (inv as any).invoice_number || inv.id,
          inv.status || "",
          Number(inv.total || 0),
          (inv as any).createdAt || (inv as any).created_at || "",
        ]),
      ];

      blocks.push(rows.map((r) => r.join(",")).join("\n"));
    }

    const finalText = blocks.join("\n\n");
    const blob = new Blob([finalText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `reports-export-${toISODate(new Date())}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /* ---------------- Loading ---------------- */

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading reports...
          </p>
        </div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">
            Reports Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Export data, filter reports, and view detailed inventory + invoice tables
          </p>
        </div>

        <button
          onClick={runExport}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          Export Selected
        </button>
      </div>

      {/* SUMMARY CARDS (DIFFERENT STYLE FROM DASHBOARD) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Expired Medicines"
          value={expiredMedicines.length}
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
        />
        <SummaryCard
          title="Low Stock Medicines"
          value={lowStockMedicines.length}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <SummaryCard
          title="Out of Stock"
          value={outOfStockMedicines.length}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <SummaryCard
          title="Completed Invoices"
          value={completedCount}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* FILTERS + EXPORT SETTINGS */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* FILTERS */}
        <Card className="rounded-2xl lg:col-span-7">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              Filters
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search medicine name / category..."
                  className="w-full rounded-xl border border-border bg-background px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Category */}
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="All">All Categories</option>
                {Object.values(Category).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Other">Other</option>
              </select>

              {/* Stock filter */}
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All Stock</option>
                <option value="in">In Stock (&gt; 20)</option>
                <option value="low">Low Stock (1-20)</option>
                <option value="out">Out of Stock (0)</option>
                <option value="expired">Expired</option>
              </select>

              {/* Date range */}
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <select
                  value={rangePreset}
                  onChange={(e) => setRangePreset(e.target.value as any)}
                  className="w-full bg-transparent text-sm outline-none"
                >
                  <option value="today">Today</option>
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            {rangePreset === "custom" ? (
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            ) : null}

            <div className="text-xs text-muted-foreground">
              Showing <b>{filteredMedicines.length}</b> medicines •{" "}
              <b>{filteredInvoices.length}</b> invoices (filtered)
            </div>
          </CardContent>
        </Card>

        {/* EXPORT SETTINGS */}
        <Card className="rounded-2xl lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="h-4 w-4 text-muted-foreground" />
              Export CSV (Advanced)
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <ExportCheck
              checked={expMedicines}
              onChange={setExpMedicines}
              label="Medicines"
            />
            <ExportCheck
              checked={expInvoices}
              onChange={setExpInvoices}
              label="Invoices"
            />

            <div className="h-px bg-border" />

            <ExportCheck
              checked={expLowOnly}
              onChange={setExpLowOnly}
              label="Low stock only"
            />
            <ExportCheck
              checked={expExpiredOnly}
              onChange={setExpExpiredOnly}
              label="Expired only"
            />
            <ExportCheck
              checked={expCompletedOnly}
              onChange={setExpCompletedOnly}
              label="Completed invoices only"
            />

            <p className="text-xs text-muted-foreground">
              Export respects the selected date range + invoice filters.
            </p>

            <button
              onClick={runExport}
              className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Download CSV
            </button>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Stock Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Category Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* MONTHLY TREND */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* TABLES */}
      <div className="grid gap-6 lg:grid-cols-12">
        <TableCard
          title="Expired Medicines"
          subtitle="Medicines that are already expired"
          className="lg:col-span-6"
        >
          <SimpleMedicineTable medicines={expiredMedicines.slice(0, 10)} mode="expired" />
        </TableCard>

        <TableCard
          title="Low Stock Medicines"
          subtitle="Medicines that need restocking soon"
          className="lg:col-span-6"
        >
          <SimpleMedicineTable medicines={lowStockMedicines.slice(0, 10)} mode="low" />
        </TableCard>

        <TableCard
          title="Top 10 Expensive Medicines"
          subtitle="Highest price medicines (for audit)"
          className="lg:col-span-6"
        >
          <SimpleMedicineTable medicines={topExpensiveMedicines} mode="price" />
        </TableCard>

        <TableCard
          title="Recent Invoices"
          subtitle="Latest invoices (all statuses)"
          className="lg:col-span-6"
        >
          <SimpleInvoiceTable invoices={recentInvoices} />
        </TableCard>
      </div>
    </div>
  );
}

/* ---------------- Small UI ---------------- */

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ExportCheck({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm hover:bg-muted/30 transition"
    >
      <span className="flex items-center gap-2">
        {checked ? (
          <CheckSquare className="h-4 w-4 text-primary" />
        ) : (
          <Square className="h-4 w-4 text-muted-foreground" />
        )}
        {label}
      </span>
      <span className="text-xs text-muted-foreground">
        {checked ? "Selected" : "Off"}
      </span>
    </button>
  );
}

function TableCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`rounded-2xl ${className}`}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SimpleMedicineTable({
  medicines,
  mode,
}: {
  medicines: Medicine[];
  mode: "expired" | "low" | "price";
}) {
  if (!medicines.length) {
    return <p className="text-sm text-muted-foreground">No data found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b">
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Category</th>
            <th className="py-2 pr-3">Stock</th>
            <th className="py-2 pr-3">
              {mode === "price" ? "Price" : "Expiry"}
            </th>
          </tr>
        </thead>
        <tbody>
          {medicines.map((m) => (
            <tr key={m.id} className="border-b last:border-b-0">
              <td className="py-2 pr-3 font-medium">{m.name}</td>
              <td className="py-2 pr-3">{m.category || "Other"}</td>
              <td className="py-2 pr-3">{Number(m.stock || 0)}</td>
              <td className="py-2 pr-3">
                {mode === "price"
                  ? `₹${Number(m.price || 0)}`
                  : String(m.expiry_date || "N/A")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimpleInvoiceTable({ invoices }: { invoices: Invoice[] }) {
  if (!invoices.length) {
    return <p className="text-sm text-muted-foreground">No invoices found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b">
            <th className="py-2 pr-3">Invoice</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Total</th>
            <th className="py-2 pr-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={String(inv.id)} className="border-b last:border-b-0">
              <td className="py-2 pr-3 font-medium">
                {(inv as any).invoiceNumber ||
                  (inv as any).invoice_number ||
                  inv.id}
              </td>
              <td className="py-2 pr-3">{inv.status || "-"}</td>
              <td className="py-2 pr-3">{formatINR(Number(inv.total || 0))}</td>
              <td className="py-2 pr-3">
                {String((inv as any).createdAt || (inv as any).created_at || "-")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
