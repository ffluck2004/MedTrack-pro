// client/src/App.tsx
import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./routes/PrivateRoute";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";

/* AUTH */
import Login from "@/auth/Login";
import Register from "@/auth/Register";
import VerifyEmail from "@/auth/VerifyEmail";
import RegisterSuccess from "@/auth/RegisterSuccess";

/* PAGES */
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

/* SHELL */
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatAssistant } from "@/components/chat-assistant";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      {theme === "light" ? <Moon /> : <Sun />}
    </Button>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between h-16 px-6 border-b">
            <SidebarTrigger />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
        <ChatAssistant />
      </div>
    </SidebarProvider>
  );
}

function Routes() {
  return (
    <Switch>
      {/* PUBLIC */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/register-success" component={RegisterSuccess} />

      {/* PROTECTED */}
      <Route path="/dashboard">
        <PrivateRoute>
          <AppShell>
            <Dashboard />
          </AppShell>
        </PrivateRoute>
      </Route>

      <Route path="/inventory">
        <PrivateRoute>
          <AppShell>
            <Inventory />
          </AppShell>
        </PrivateRoute>
      </Route>

      <Route path="/add-medicine">
        <PrivateRoute>
          <AppShell>
            <AddMedicine />
          </AppShell>
        </PrivateRoute>
      </Route>

      <Route path="/billing">
        <PrivateRoute>
          <AppShell>
            <Billing />
          </AppShell>
        </PrivateRoute>
      </Route>

      <Route path="/customers">
        <PrivateRoute>
          <AppShell>
            <Customers />
          </AppShell>
        </PrivateRoute>
      </Route>

      <Route path="/suppliers">
        <PrivateRoute>
          <AppShell>
            <Suppliers />
          </AppShell>
        </PrivateRoute>
      </Route>

      <Route path="/purchase-orders">
        <PrivateRoute>
          <AppShell>
            <PurchaseOrders />
          </AppShell>
        </PrivateRoute>
      </Route>

      <Route path="/reports">
        <PrivateRoute>
          <AppShell>
            <Reports />
          </AppShell>
        </PrivateRoute>
      </Route>

      <Route path="/settings">
        <PrivateRoute>
          <AppShell>
            <Settings />
          </AppShell>
        </PrivateRoute>
      </Route>

      {/* ROOT */}
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

/* ✅ THIS WAS MISSING */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Routes />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
