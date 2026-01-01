import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./routes/PrivateRoute";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatAssistant } from "@/components/chat-assistant";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

/* AUTH PAGES */
import Login from "@/auth/Login";
import Register from "@/auth/Register";
import VerifyEmail from "@/auth/VerifyEmail";

/* APP PAGES */
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import AddMedicine from "@/pages/add-medicine";
import Billing from "@/pages/billing";
import Customers from "@/pages/customers";
import Suppliers from "@/pages/suppliers";
import PurchaseOrders from "@/pages/purchase-orders";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

/* ---------------- THEME TOGGLE ---------------- */

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === "light" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}

/* ---------------- ROUTER ---------------- */

function AppRouter() {
  return (
    <Switch>
      {/* ===== PUBLIC AUTH ROUTES ===== */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />

      {/* ===== PROTECTED ROUTES ===== */}
      <Route path="/">
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      </Route>

      <Route path="/inventory">
        <PrivateRoute>
          <Inventory />
        </PrivateRoute>
      </Route>

      <Route path="/add-medicine">
        <PrivateRoute>
          <AddMedicine />
        </PrivateRoute>
      </Route>

      <Route path="/edit-medicine/:id">
        <PrivateRoute>
          <AddMedicine />
        </PrivateRoute>
      </Route>

      <Route path="/billing">
        <PrivateRoute>
          <Billing />
        </PrivateRoute>
      </Route>

      <Route path="/customers">
        <PrivateRoute>
          <Customers />
        </PrivateRoute>
      </Route>

      <Route path="/suppliers">
        <PrivateRoute>
          <Suppliers />
        </PrivateRoute>
      </Route>

      <Route path="/purchase-orders">
        <PrivateRoute>
          <PurchaseOrders />
        </PrivateRoute>
      </Route>

      <Route path="/reports">
        <PrivateRoute>
          <Reports />
        </PrivateRoute>
      </Route>

      <Route path="/settings">
        <PrivateRoute>
          <Settings />
        </PrivateRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

/* ---------------- APP LAYOUT ---------------- */

function AppLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-background">
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-6 bg-background">
            <AppRouter />
          </main>
        </div>
        <ChatAssistant />
      </div>
    </SidebarProvider>
  );
}

/* ---------------- ROOT SWITCH ---------------- */

function AppRoot() {
  const [location] = useLocation();

  const isAuthPage =
    location.startsWith("/login") ||
    location.startsWith("/register") ||
    location.startsWith("/verify-email");

  return isAuthPage ? <AppRouter /> : <AppLayout />;
}

/* ---------------- APP ENTRY ---------------- */

function App() {
  return (
    <WouterRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              <AppRoot />
              <Toaster />
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
