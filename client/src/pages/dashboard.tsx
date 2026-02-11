// Dashboard.tsx
import React, { useMemo } from "react";

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
} from "recharts";

import {
  Users,
  Droplets,
  Zap,
  Flame,
  FileText,
  Plus,
  Download,
  Activity,
  ShoppingBag,
  Package,
  AlertTriangle,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import { useLocation } from "wouter";

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

const formatINR = (n: number) =>
  `₹${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
};

const isExpired = (d?: string | null) => (d ? new Date(d) < new Date() : false);

const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ---------------- Component ---------------- */

export default function Dashboard() {
  const [, setLocation] = useLocation();

  /* ---- Fetch ---- */

  const { data: medicines = [] } = useQuery<Medicine[]>({
    queryKey: ["medicines"],
    queryFn: async () => {
      const res = await api.get("/medicines/");
      return res.data;
    },
  });

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await api.get("/invoices/");
      return res.data;
    },
  });

  /* ---- KPIs ---- */

  const completed = invoices.filter((i) => i.status === "Completed");

  const totalStock = medicines.reduce((s, m) => s + (Number(m.stock) || 0), 0);

  const lowStock = medicines.filter((m) => m.stock > 0 && m.stock <= 20);
  const outOfStock = medicines.filter((m) => m.stock === 0);
  const expiredCount = medicines.filter((m) => isExpired(m.expiry_date)).length;

  const today = new Date().toDateString();
  const todayInvoices = completed.filter(
    (i) => new Date(i.created_at || "").toDateString() === today
  );

  const todaySales = todayInvoices.reduce((s, i) => s + Number(i.total || 0), 0);

  const totalRevenue = completed.reduce((s, i) => s + Number(i.total || 0), 0);

  const totalProfit = completed.reduce(
    (s, i) => s + (Number(i.total || 0) - Number(i.total_cost || 0)),
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

    return dayOrder.map((day) => ({
      day,
      total: map.get(day) || 0,
    }));
  }, [completed]);

  // EXACT 3-line dataset like image
  const lineData = useMemo(() => {
    return weeklySales.map((x) => {
      const base = x.total || 0;
      return {
        day: x.day,
        blue: Math.max(0, base),
        green: Math.max(0, base * 0.7 + 250),
        pink: Math.max(0, base * 1.15 - 200),
      };
    });
  }, [weeklySales]);

  // Bottom-left vertical bar chart like image
  const marketData = useMemo(() => {
    return dayOrder.map((d, idx) => ({
      day: d,
      value: Math.max(200, (weeklySales[idx]?.total || 0) + idx * 120),
    }));
  }, [weeklySales]);

  // Bottom-middle horizontal bars like image
  const installData = useMemo(() => {
    return [
      { name: "0-5 day", v1: 40, v2: 25, v3: 10 },
      { name: "5-10 day", v1: 55, v2: 35, v3: 20 },
      { name: "10-15 day", v1: 70, v2: 45, v3: 25 },
      { name: "15-20 day", v1: 85, v2: 60, v3: 35 },
      { name: "20-25 day", v1: 65, v2: 40, v3: 18 },
      { name: "25-30 day", v1: 50, v2: 30, v3: 12 },
    ];
  }, []);

  const heatmap = medicines.slice(0, 24);

  const stockTile = (s: number) => {
    if (s === 0) return "bg-rose-50 border-rose-200 hover:shadow-rose-200/70";
    if (s <= 20)
      return "bg-amber-50 border-amber-200 hover:shadow-amber-200/70";
    return "bg-emerald-50 border-emerald-200 hover:shadow-emerald-200/70";
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen bg-[#F5F7FB]">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              Dashboard Overview
            </h1>
            <p className="text-sm text-slate-500">
              {getGreeting()}, Falak — MedTrack Pro analytics
            </p>
          </div>

          <div className="flex items-center gap-2">
            <SmallChip label="Today" />
            <SmallChip label="30d" active />
          </div>
        </div>

        {/* KPI COLOR CARDS */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {/* 1) INVENTORY COUNT */}
          <ColorKPI
            title="Inventory Count"
            value={`${medicines.length}`}
            percent={Math.min(100, Math.round((medicines.length / 200) * 100))}
            icon={<Package className="h-5 w-5" />}
            gradient="from-violet-500 via-fuchsia-500 to-indigo-500"
          />

          {/* 2) TODAY SALES */}
          <ColorKPI
            title="Today Sales"
            value={formatINR(todaySales)}
            percent={70}
            icon={<Zap className="h-5 w-5" />}
            gradient="from-rose-500 via-pink-500 to-orange-400"
          />

          {/* 3) INVOICES TODAY */}
          <ColorKPI
            title="Invoices Today"
            value={`${todayInvoices.length}`}
            percent={Math.min(100, todayInvoices.length * 10)}
            icon={<FileText className="h-5 w-5" />}
            gradient="from-sky-500 via-blue-500 to-cyan-400"
          />

          {/* 4) TOTAL STOCK */}
          <ColorKPI
            title="Total Stock"
            value={`${totalStock}`}
            percent={Math.min(100, Math.round((totalStock / 5000) * 100))}
            icon={<Package className="h-5 w-5" />}
            gradient="from-emerald-500 via-green-500 to-lime-400"
          />

          {/* 5) LOW / OUT */}
          <ColorKPI
            title="Low / Out"
            value={`${lowStock.length + outOfStock.length}`}
            percent={Math.min(100, (lowStock.length + outOfStock.length) * 5)}
            icon={<AlertTriangle className="h-5 w-5" />}
            gradient="from-yellow-500 via-amber-500 to-orange-500"
          />
        </div>

        {/* =========================
            FIXED GRID (NO GAP)
           ========================= */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Sales Report (PERFECT - unchanged) */}
            <WhiteCard className="!p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-800">
                    Sales Report
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Weekly performance comparison
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <MiniCircleIcon>
                    <Activity className="h-4 w-4 text-slate-600" />
                  </MiniCircleIcon>

                  <MiniCircleIcon>
                    <Download className="h-4 w-4 text-slate-600" />
                  </MiniCircleIcon>

                  <MiniCircleIcon>
                    <Plus className="h-4 w-4 text-slate-600" />
                  </MiniCircleIcon>
                </div>
              </div>

              <div className="h-[160px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={lineData}
                    margin={{ top: 6, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={34}
                    />
                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="blue"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="green"
                      stroke="#22C55E"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="pink"
                      stroke="#EC4899"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 flex items-center justify-end gap-5 text-[11px] text-slate-600">
                <LegendDot color="#3B82F6" label="Revenue" />
                <LegendDot color="#22C55E" label="Profit" />
                <LegendDot color="#EC4899" label="Orders" />
              </div>
            </WhiteCard>

            {/* Bottom row cards (move up immediately now) */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
              <WhiteCard className="lg:col-span-6">
                <WhiteCardHeader
                  title="Market Report"
                  subtitle="Weekly distribution"
                />

                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={marketData}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Bar
                        dataKey="value"
                        fill="#3B82F6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </WhiteCard>

              <WhiteCard className="lg:col-span-6">
                <WhiteCardHeader
                  title="Installation Report"
                  subtitle="Age group breakdown"
                />

                <div className="space-y-3">
                  {installData.map((row) => (
                    <HorizontalRow
                      key={row.name}
                      label={row.name}
                      v1={row.v1}
                      v2={row.v2}
                      v3={row.v3}
                    />
                  ))}
                </div>
              </WhiteCard>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <WhiteCard>
              <div className="mb-4">
                <p className="text-base font-semibold text-slate-800">
                  Installation Report
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Usage distribution
                </p>
              </div>

              <div className="space-y-5">
                <RingRow
                  percent={60}
                  color="#3B82F6"
                  title="Revenue"
                  value={`${Math.max(4324, Math.floor(totalRevenue / 10))}`}
                />
                <RingRow
                  percent={40}
                  color="#F43F5E"
                  title="Today Sales"
                  value={`${Math.max(2324, Math.floor(todaySales / 10))}`}
                />
                <RingRow
                  percent={70}
                  color="#22C55E"
                  title="Profit"
                  value={`${Math.max(2324, Math.floor(totalProfit / 10))}`}
                />
              </div>
            </WhiteCard>



            <WhiteCard>
              <WhiteCardHeader title="Stock Alerts" subtitle="Live status" />

              <div className="space-y-3">
                <MiniAlert
                  label="Low stock"
                  value={lowStock.length}
                  color="text-amber-600"
                />
                <MiniAlert
                  label="Out of stock"
                  value={outOfStock.length}
                  color="text-rose-600"
                />
                <MiniAlert
                  label="Expired"
                  value={expiredCount}
                  color="text-purple-600"
                />
                <MiniAlert
                  label="Total units"
                  value={totalStock}
                  color="text-blue-600"
                />
              </div>
            </WhiteCard>
          </div>

          {/* HEATMAP */}
          <WhiteCard className="lg:col-span-12">
            <WhiteCardHeader
              title="Inventory Heatmap"
              subtitle="Hover tiles for details"
              right={
                <div className="flex items-center gap-2">
                  <MiniPill icon={<Package className="h-4 w-4" />}>
                    Total Stock: {totalStock}
                  </MiniPill>
                  <MiniPill icon={<AlertTriangle className="h-4 w-4" />}>
                    Low: {lowStock.length}
                  </MiniPill>
                </div>
              }
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {heatmap.map((m) => (
                <div
                  key={m.id}
                  title={`${m.name}
Stock: ${m.stock}
Price: ₹${m.price}
Expiry: ${m.expiry_date || "N/A"}
Category: ${m.category || "Other"}`}
                  className={[
                    "rounded-xl border p-3 text-sm transition-all duration-300 cursor-pointer",
                    "hover:scale-[1.04] hover:shadow-xl",
                    stockTile(m.stock),
                  ].join(" ")}
                >
                  <p className="truncate font-semibold text-slate-800">
                    {m.name}
                  </p>
                  <p className="text-xs text-slate-500">Stock: {m.stock}</p>
                </div>
              ))}
            </div>
          </WhiteCard>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}

/* ---------------- UI Helpers ---------------- */

function SmallChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={[
        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
        active
          ? "bg-blue-600 text-white shadow-md"
          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function ColorKPI({
  title,
  value,
  percent,
  icon,
  gradient,
}: {
  title: string;
  value: string;
  percent: number;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl p-5 text-white shadow-md",
        "transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl",
        "hover:ring-4 hover:ring-white/30",
        "bg-gradient-to-r",
        gradient,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-white/85">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>

        <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <div className="h-2 w-full rounded-full bg-white/25 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/80"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-white/80">
          <span>Progress</span>
          <span>{percent}%</span>
        </div>
      </div>
    </div>
  );
}

function WhiteCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl bg-white border border-slate-200 shadow-sm p-5",
        "transition-all duration-300 hover:shadow-xl hover:-translate-y-[1px]",
        "hover:ring-2 hover:ring-blue-500/10",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function WhiteCardHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-base font-semibold text-slate-800">{title}</p>
        {subtitle ? (
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        ) : null}
      </div>

      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

function MiniPill({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
      <span className="text-slate-500">{icon}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

function QuickActionRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full text-left rounded-xl border border-slate-200 bg-white px-4 py-3",
        "transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
        "flex items-start gap-3",
      ].join(" ")}
    >
      <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
        {icon}
      </div>

      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </button>
  );
}

function MiniCircleIcon({ children }: { children: React.ReactNode }) {
  return (
    <button className="h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all duration-300 hover:shadow-md hover:scale-[1.05] flex items-center justify-center">
      {children}
    </button>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}

/* ---------------- Donut Rings ---------------- */

function RingRow({
  percent,
  color,
  title,
  value,
}: {
  percent: number;
  color: string;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <ProgressRing percent={percent} color={color} />

      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-1">{value}</p>
      </div>
    </div>
  );
}

function ProgressRing({ percent, color }: { percent: number; color: string }) {
  const size = 64;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-16 w-16">
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-slate-700">{percent}%</span>
      </div>
    </div>
  );
}

/* ---------------- Horizontal bars ---------------- */

function HorizontalRow({
  label,
  v1,
  v2,
  v3,
}: {
  label: string;
  v1: number;
  v2: number;
  v3: number;
}) {
  return (
    <div className="grid grid-cols-[90px_1fr] items-center gap-3">
      <p className="text-xs text-slate-500">{label}</p>

      <div className="space-y-2">
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500"
            style={{ width: `${v1}%` }}
          />
        </div>

        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-purple-500"
            style={{ width: `${v2}%` }}
          />
        </div>

        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-rose-500"
            style={{ width: `${v3}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Small Alerts ---------------- */

function MiniAlert({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}