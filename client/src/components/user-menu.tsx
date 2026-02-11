import { useState } from "react";
import { LogOut, User, Settings } from "lucide-react";
import { useLocation } from "wouter";

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) return null;

  const initials =
    (user.username?.[0] || user.email?.[0] || "U").toUpperCase();

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } finally {
      setLoggingOut(false);
      setLocation("/login");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>

          <div className="hidden text-left leading-tight md:block">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="space-y-1">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setLocation("/settings")}>
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          disabled={loggingOut}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "Logging out..." : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
