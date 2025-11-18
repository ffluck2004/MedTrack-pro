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
  Calendar,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Medicine, Invoice } from "@shared/schema";

const COLORS = ["#4ade80", "#60a5fa", "#f87171", "#facc15", "#a78bfa"];

export default function Dashboard() {
  const { data: medicines = [] } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  /* --------------------------- Derived Metrics ---------------------------- */
  const totalMedicines = medicines.length;
  const lowStock = medicines.filter((m) => m.stock > 0 && m.stock <= 20);
  const outOfStock = medicines.filter((m) => m.stock === 0);
  const expired = medicines.filter((m) => new Date(m.expiryDate) < new Date());
  const expiringSoon = medicines.filter((m) => {
    const days = Math.ceil(
      (new Date(m.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days > 0 && days <= 60;
  });

  const totalRevenue = invoices
    .filter((inv) => inv.status === "Completed")
    .reduce((sum, inv) => sum + Number(inv.total || 0), 0);

  const totalProfit = invoices
    .filter((inv) => inv.status === "Completed")
    .reduce(
      (sum, inv) =>
        sum + (Number(inv.total || 0) - Number(inv.totalCost || 0)),
      0
    );

  /* --------------------------- Chart Data ---------------------------- */
  const weeklySalesData = useMemo(() => {
    const map = new Map<string, number>();
    invoices.forEach((inv) => {
      if (inv.status !== "Completed") return;
      const date = new Date(inv.date).toLocaleDateString("en-IN", {
        weekday: "short",
      });
      map.set(date, (map.get(date) || 0) + Number(inv.total || 0));
    });
    return Array.from(map.entries()).map(([day, total]) => ({
      day,
      total,
    }));
  }, [invoices]);

  const stockDistribution = [
    { name: "Low Stock", value: lowStock.length },
    { name: "Out of Stock", value: outOfStock.length },
    { name: "Expiring Soon", value: expiringSoon.length },
    { name: "Expired", value: expired.length },
    {
      name: "Healthy Stock",
      value:
        totalMedicines -
        (lowStock.length + outOfStock.length + expired.length + expiringSoon.length),
    },
  ];

  const profitMarginData = invoices
    .filter((inv) => inv.status === "Completed")
    .slice(0, 10)
    .map((inv) => ({
      name: inv.invoiceNumber,
      profit: Number(inv.total) - Number(inv.totalCost),
    }));

  /* --------------------------- AI-style Daily Insight ---------------------------- */
  const todayInsight = useMemo(() => {
    const todayInvoices = invoices.filter(
      (inv) =>
        new Date(inv.date).toDateString() === new Date().toDateString() &&
        inv.status === "Completed"
    );
    if (todayInvoices.length === 0)
      return "No sales yet today. Add some invoices to see insights.";
    const total = todayInvoices.reduce((s, inv) => s + Number(inv.total || 0), 0);
    const bestTime = "6–8 PM"; // placeholder until time analytics implemented
    return `You've made ₹${total.toFixed(
      2
    )} today. Your busiest hours are likely around ${bestTime}. Keep it up!`;
  }, [invoices]);

  /* --------------------------- Render ---------------------------- */
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your pharmacy performance
        </p>
      </div>

      {/* 🔹 Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Medicines"
          value={totalMedicines}
          icon={<Package className="h-4 w-4" />}
        />
        <MetricCard
          title="Low/Out of Stock"
          value={lowStock.length + outOfStock.length}
          icon={<AlertTriangle className="h-4 w-4 text-yellow-600" />}
        />
        <MetricCard
          title="Total Revenue"
          value={`₹${totalRevenue.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4 text-green-600" />}
        />
        <MetricCard
          title="Total Profit"
          value={`₹${totalProfit.toFixed(2)}`}
          icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
        />
      </div>

      {/* 🔹 Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Sales</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklySalesData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Profit Margin */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Invoice Profits</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitMarginData}>
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" />
                <Bar dataKey="profit" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 🔹 Stock Health Pie */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Health</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stockDistribution}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
                {stockDistribution.map((_, index) => (
                  <Cell
                    key={index}
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

      {/* 🔹 AI-style Daily Insight */}
      <Card className="border border-primary/30">
        <CardHeader>
          <CardTitle>Daily Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">💡 {todayInsight}</p>
        </CardContent>
      </Card>
    </div>
  );
}

/* --------------------------- Helper Components ---------------------------- */
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
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
