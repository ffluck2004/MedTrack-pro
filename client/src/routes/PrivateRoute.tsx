import { Redirect } from "wouter";
import { useAuth } from "@/context/AuthContext";
import React from "react";

type Props = {
  children: React.ReactNode;
};

export default function PrivateRoute({ children }: Props) {
  const { user, loading } = useAuth();

  // ⏳ WAIT until auth is resolved
  if (loading || user === undefined) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // 🔐 Redirect ONLY if explicitly unauthenticated
  if (user === null) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
}
