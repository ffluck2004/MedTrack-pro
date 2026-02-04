import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import api from "@/api/axios";

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
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // 🔑 IMPORTANT: undefined = not checked yet
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  // Restore session ONCE
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await api.get("/auth/me/");
        if (mounted) {
          setUser(res.data.user ?? null);
        }
      } catch {
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login/", { email, password });
    setUser(res.data.user);
  };

  const googleLogin = async (idToken: string) => {
    const res = await api.post("/auth/google-login/", { id_token: idToken });
    setUser(res.data.user);
  };

  const logout = async () => {
    await api.post("/auth/logout/");
    setUser(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
