import React, { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Plus,
  FileText,
  ShoppingBag,
  Download,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";

/* ---------------- Types ---------------- */

interface Medicine {
  id: string;
  name: string;
  stock: number;
  price: number;
  cost: number;
  expiry_date?: string | null;
  category?: string;
}

interface Invoice {
  id: string | number;
  invoice_number: string;
  total: number;
  total_cost: number;
  status?: string;
  created_at?: string;
}

/* ---------------- Utils ---------------- */

const COLORS = ["#A7F3D0", "#BFDBFE", "#FECACA", "#FDE68A", "#DDD6FE"];

const isExpired = (d?: string | null) =>
  d ? new Date(d) < new Date() : false;

/* ---------------- Component ---------------- */

export default function Dashboard() {
  /* ---- Fetch ---- */
  const { data: medicines = [] } = useQuery<Medicine[]>({
    queryKey: ["medicines"],
    queryFn: async () => (await fetch("/api/medicines/")).json(),
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => (await fetch("/api/invoices/")).json(),
  });

  /* ---- KPIs ---- */

  const completed = invoices.filter((i) => i.status === "Completed");

  const totalStock = medicines.reduce((s, m) => s + (Number(m.stock) || 0), 0);
  const lowStock = medicines.filter((m) => m.stock > 0 && m.stock <= 20);
  const outOfStock = medicines.filter((m) => m.stock === 0);

  const today = new Date().toDateString();
  const todayInvoices = completed.filter(
    (i) => new Date(i.created_at || "").toDateString() === today
  );

  const todaySales = todayInvoices.reduce(
    (s, i) => s + Number(i.total || 0),
    0
  );

  const totalRevenue = completed.reduce(
    (s, i) => s + Number(i.total || 0),
    0
  );

  const totalProfit = completed.reduce(
    (s, i) =>
      s + (Number(i.total || 0) - Number(i.total_cost || 0)),
    0
  );

  /* ---- Charts ---- */

  const weeklySales = useMemo(() => {
    const map = new Map<string, number>();
    completed.forEach((i) => {
      const d = new Date(i.created_at || "").toLocaleDateString("en-IN", {
        weekday: "short",
      });
      map.set(d, (map.get(d) || 0) + Number(i.total || 0));
    });
    return [...map.entries()].map(([day, total]) => ({ day, total }));
  }, [completed]);

  const profitData = completed.slice(0, 10).map((i) => ({
    name: i.invoice_number,
    profit: Number(i.total) - Number(i.total_cost),
  }));

  const stockHealth = [
    { name: "Low", value: lowStock.length },
    { name: "Out", value: outOfStock.length },
    {
      name: "Expired",
      value: medicines.filter((m) => isExpired(m.expiry_date)).length,
    },
    {
      name: "Healthy",
      value:
        medicines.length -
        lowStock.length -
        outOfStock.length -
        medicines.filter((m) => isExpired(m.expiry_date)).length,
    },
  ];

  const categoryData = Object.values(
    medicines.reduce((acc: any, m) => {
      const k = m.category || "Other";
      acc[k] = acc[k] || { name: k, stock: 0 };
      acc[k].stock += Number(m.stock) || 0;
      return acc;
    }, {})
  );

  const expiryData = medicines
    .filter((m) => m.expiry_date)
    .map((m) => {
      const days =
        (new Date(m.expiry_date!).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24);
      return {
        name: m.name,
        days: Math.ceil(days),
      };
    })
    .filter((x) => x.days <= 90);

  /* ---- Heatmap ---- */
  const heatmap = medicines.slice(0, 20);

  const stockColor = (s: number) => {
    if (s === 0) return "bg-red-100";
    if (s <= 20) return "bg-amber-100";
    return "bg-emerald-100";
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="space-y-8 bg-white p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">
          Good afternoon, Falak 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Pharmacy productivity dashboard
        </p>
      </div>

      {/* KPI STRIP */}
      <div className="grid gap-4 md:grid-cols-5">
        <KPI title="Today Sales" value={`₹${todaySales.toFixed(2)}`} icon={<DollarSign />} />
        <KPI title="Invoices Today" value={todayInvoices.length} icon={<FileText />} />
        <KPI title="Total Stock" value={totalStock} icon={<Package />} />
        <KPI title="Low / Out" value={lowStock.length + outOfStock.length} icon={<AlertTriangle />} />
        <KPI title="Total Profit" value={`₹${totalProfit.toFixed(2)}`} icon={<TrendingUp />} />
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex flex-wrap gap-3">
        <Action label="Add Medicine" icon={<Plus className="h-4 w-4" />} to="/add-medicine" />
        <Action label="Create Invoice" icon={<FileText className="h-4 w-4" />} to="/billing" />
        <Action label="Record Purchase" icon={<ShoppingBag className="h-4 w-4" />} to="/purchase-orders" />
        <Action label="Download Report" icon={<Download className="h-4 w-4" />} to="/reports" />
      </div>

      {/* PERFORMANCE */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard title="Weekly Sales Trend">
          <ResponsiveContainer>
            <LineChart data={weeklySales}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <CartesianGrid strokeDasharray="3 3" />
              <Line dataKey="total" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Profit per Invoice">
          <ResponsiveContainer>
            <BarChart data={profitData}>
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <CartesianGrid />
              <Bar dataKey="profit" fill="#34d399" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* INVENTORY INTELLIGENCE */}
      <div className="grid gap-6 md:grid-cols-3">
        <ChartCard title="Inventory Health">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={stockHealth}
                dataKey="value"
                outerRadius={90}
                innerRadius={50}
              >
                {stockHealth.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Stock by Category">
          <ResponsiveContainer>
            <BarChart data={categoryData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="stock" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Expiry Risk (≤ 90 days)">
          <ResponsiveContainer>
            <BarChart data={expiryData}>
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="days" fill="#fca5a5" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* HEATMAP */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {heatmap.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl p-3 text-sm ${stockColor(
                  m.stock
                )}`}
              >
                <p className="font-medium truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  Stock: {m.stock}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function KPI({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">{children}</CardContent>
    </Card>
  );
}

function Action({
  icon,
  label,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  to: string;
}) {
  return (
    <button
      onClick={() => (window.location.href = to)}
      className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 transition"
    >
      {icon}
      {label}
    </button>
  );
}
