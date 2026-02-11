import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import api from "@/api/axios";
import { queryClient } from "@/lib/queryClient";

type User = {
  id: number;
  email: string;
  username: string;
  role: string;
};

type AuthContextType = {
  user: User | null | undefined;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  const refreshUser = async () => {
    try {
      const res = await api.get("/auth/me/");
      setUser(res.data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Restore session once
  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login/", { email, password });
    setUser(res.data.user);

    // ✅ refresh cached API after login
    queryClient.clear();
  };

  const googleLogin = async (idToken: string) => {
    const res = await api.post("/auth/google-login/", { id_token: idToken });
    setUser(res.data.user);

    // ✅ refresh cached API after login
    queryClient.clear();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout/");
    } catch {
      // ignore error (still clear frontend)
    }

    // ✅ Clear everything
    setUser(null);
    queryClient.clear();

    // ✅ Redirect
    setLocation("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, googleLogin, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
