import React, { useMemo, useEffect } from "react";
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
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
} from "lucide-react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

// IMPORTANT — your backend json uses expiry_date
interface Medicine {
  id: string;
  name: string;
  stock: number;
  price: number;
  cost: number;
  expiry_date?: string | null;
  barcode?: string;
  manufacturer?: string;
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

const COLORS = ["#4ade80", "#60a5fa", "#f87171", "#facc15", "#a78bfa"];

export default function Dashboard() {
  const queryClient = useQueryClient();

  /* ------------------------------------------------------------------
        FETCH DATA (LIVE FROM BACKEND)
        - refetchInterval gives periodic refresh (10s)
        - refetchOnWindowFocus ensures refetch when user returns
        - refetchOnReconnect helps when network back
        - staleTime kept small so derived metrics recalc on new data
  ------------------------------------------------------------------ */
  const { data: medicines = [] } = useQuery<Medicine[]>({
    queryKey: ["medicines"],
    queryFn: async () => {
      const res = await fetch("/api/medicines/");
      return res.json();
    },
    refetchInterval: 10000, // 10s poll as a fallback (you can reduce/increase)
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 5000,
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await fetch("/api/invoices/");
      return res.json();
    },
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    staleTime: 5000,
  });

  /* ------------------------------------------------------------------
        Listen for app-wide refresh events (billing can dispatch this)
        Usage: window.dispatchEvent(new Event("medtrack:refresh"))
  ------------------------------------------------------------------ */
  useEffect(() => {
    const handler = () => {
      // Invalidate queries so react-query refetches immediately
      queryClient.invalidateQueries(["medicines"]);
      queryClient.invalidateQueries(["invoices"]);
    };

    window.addEventListener("medtrack:refresh", handler);

    return () => {
      window.removeEventListener("medtrack:refresh", handler);
    };
  }, [queryClient]);

  /* ------------------------------------------------------------------
        DERIVED METRICS
  ------------------------------------------------------------------ */

  // ensure numeric stock
  const totalStock = medicines.reduce((sum, m) => {
    const stk = Number(m?.stock ?? 0);
    return sum + (Number.isFinite(stk) ? stk : 0);
  }, 0);

  const lowStock = medicines.filter((m) => {
    const s = Number(m?.stock ?? 0);
    return s > 0 && s <= 20;
  });

  const outOfStock = medicines.filter((m) => Number(m?.stock ?? 0) === 0);

  const expired = medicines.filter((m) =>
    m.expiry_date ? new Date(m.expiry_date) < new Date() : false
  );

  const expiringSoon = medicines.filter((m) => {
    if (!m.expiry_date) return false;
    const days = Math.ceil(
      (new Date(m.expiry_date).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
    );
    return days > 0 && days <= 60;
  });

  const totalRevenue = invoices
    .filter((inv) => inv.status === "Completed")
    .reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

  const totalProfit = invoices
    .filter((inv) => inv.status === "Completed")
    .reduce(
      (sum, inv) =>
        sum + ((Number(inv.total) || 0) - (Number(inv.total_cost) || 0)),
      0
    );

  /* ------------------------------------------------------------------
        CHART DATA
  ------------------------------------------------------------------ */

  const weeklySalesData = useMemo(() => {
    const map = new Map<string, number>();

    invoices.forEach((inv) => {
      if (inv.status !== "Completed") return;

      const day = new Date(inv.created_at || "").toLocaleDateString("en-IN", {
        weekday: "short",
      });

      map.set(day, (map.get(day) || 0) + Number(inv.total || 0));
    });

    return [...map.entries()].map(([day, total]) => ({ day, total }));
  }, [invoices]);

  const stockDistribution = [
    { name: "Low Stock", value: lowStock.length },
    { name: "Out of Stock", value: outOfStock.length },
    { name: "Expiring Soon", value: expiringSoon.length },
    { name: "Expired", value: expired.length },
    {
      name: "Healthy Stock",
      value:
        medicines.length -
        (lowStock.length +
          outOfStock.length +
          expired.length +
          expiringSoon.length),
    },
  ];

  const profitMarginData = invoices
    .filter((inv) => inv.status === "Completed")
    .slice(0, 10)
    .map((inv) => ({
      name: inv.invoice_number,
      profit: Number(inv.total) - Number(inv.total_cost),
    }));

  /* ------------------------------------------------------------------
        DAILY INSIGHT
  ------------------------------------------------------------------ */

  const todayInsight = useMemo(() => {
    const today = new Date().toDateString();
    const todayInvoices = invoices.filter(
      (inv) =>
        new Date(inv.created_at || "").toDateString() === today &&
        inv.status === "Completed"
    );

    if (todayInvoices.length === 0) return "No sales yet today.";

    const total = todayInvoices.reduce(
      (sum, inv) => sum + Number(inv.total || 0),
      0
    );

    return `You've made ₹${total.toFixed(2)} today. Keep going!`;
  }, [invoices]);

  /* ------------------------------------------------------------------
        RENDER UI (unchanged look & layout)
  ------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Live overview of your store
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Stock"
          value={totalStock}
          icon={<Package />}
        />
        <MetricCard
          title="Low/Out of Stock"
          value={lowStock.length + outOfStock.length}
          icon={<AlertTriangle className="text-yellow-600" />}
        />
        <MetricCard
          title="Total Revenue"
          value={`₹${totalRevenue.toFixed(2)}`}
          icon={<DollarSign className="text-green-600" />}
        />
        <MetricCard
          title="Total Profit"
          value={`₹${totalProfit.toFixed(2)}`}
          icon={<TrendingUp className="text-blue-600" />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Sales</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <LineChart data={weeklySalesData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" />
                <Line dataKey="total" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Profits</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <BarChart data={profitMarginData}>
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <CartesianGrid />
                <Bar dataKey="profit" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Health</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center h-72">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={stockDistribution}
                dataKey="value"
                nameKey="name"
                outerRadius={110}
                label
              >
                {stockDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Insight */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Insight</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="italic text-sm text-muted-foreground">💡 {todayInsight}</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------
   HELPER: METRIC CARD
------------------------------------------------------------------ */

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="hover:shadow-md transition">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
