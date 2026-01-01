import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

interface User {
  email: string;
  username: string;
  role: "ADMIN" | "STAFF";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Restore session on reload
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const access = localStorage.getItem("access");

    if (storedUser && access) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // LOGIN
  const login = async (email: string, password: string) => {
    const res = await api.post("/auth/login/", { email, password });

    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    setUser(res.data.user);
    setIsAuthenticated(true);
  };

  // LOGOUT
  const logout = () => {
    localStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
