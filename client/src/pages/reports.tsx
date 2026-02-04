import { useQuery } from "@tanstack/react-query";
import { Medicine, Invoice, Category } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "recharts";
import {
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
// FIX: apiRequest added to supply queryFn (React Query v5 requirement)

const COLORS = [
  "#0D9488",
  "#14B8A6",
  "#2DD4BF",
  "#5EEAD4",
  "#99F6E4",
  "#CCFBF1",
  "#F0FDFA",
];

export default function Reports() {
  const {
    data: medicines = [],
    isLoading: medicinesLoading,
  } = useQuery<Medicine[]>({
    queryKey: ["/api/medicines"],
    // FIX: React Query v5 requires explicit queryFn
    queryFn: async () =>
      apiRequest("GET", "/api/medicines"),
  });

  const {
    data: invoices = [],
    isLoading: invoicesLoading,
  } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    // FIX: React Query v5 requires explicit queryFn
    queryFn: async () =>
      apiRequest("GET", "/api/invoices"),
  });

  const isLoading = medicinesLoading || invoicesLoading;

  /* ---------------- Metrics ---------------- */

  const completedInvoices = invoices.filter(
    (inv) => inv.status === "Completed"
  );

  const totalRevenue = completedInvoices.reduce(
    (sum, inv) =>
      sum + Number(inv.total),
    0
  );
  // FIX: safer numeric conversion (avoids parseFloat on number|string)

  const totalProfit = completedInvoices.reduce(
    (sum, inv) =>
      sum +
      (Number(inv.total) -
        Number(inv.totalCost)),
    0
  );
  // FIX: numeric safety for totalCost

  const totalSales = completedInvoices.length;

  /* ---------------- Charts Data ---------------- */

  const categoryData = Object.values(Category)
    .map((cat) => ({
      name: cat,
      value: medicines.filter(
        (m) => m.category === cat
      ).length,
    }))
    .filter((item) => item.value > 0);

  const stockData = [
    {
      name: "In Stock",
      value: medicines.filter(
        (m) => m.stock > 20
      ).length,
    },
    {
      name: "Low Stock",
      value: medicines.filter(
        (m) => m.stock > 0 && m.stock <= 20
      ).length,
    },
    {
      name: "Out of Stock",
      value: medicines.filter(
        (m) => m.stock === 0
      ).length,
    },
  ];

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
      <div>
        <h1 className="text-3xl font-semibold text-foreground">
          Reports & Analytics
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View insights and statistics
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Medicines
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {medicines.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sales
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSales}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Profit
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ₹{totalProfit.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              Stock Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <BarChart data={stockData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Medicine Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer
              width="100%"
              height={300}
            >
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={(e) => e.name}
                >
                  {categoryData.map(
                    (_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          COLORS[
                          index %
                          COLORS.length
                          ]
                        }
                      />
                    )
                  )}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
