import { useState } from "react";
import { useLocation, Link, Redirect } from "wouter";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

import loginImg from "@/assets/login-illustration.png";

export default function Login() {
  const { login, googleLogin, user } = useAuth();
  const [, setLocation] = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Redirect to="/dashboard" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      setLocation("/dashboard");
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.non_field_errors?.[0] ||
        "Invalid email or password";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl border">
        <div className="grid md:grid-cols-2">
          {/* LEFT FORM */}
          <div className="p-8 md:p-12">
            <h1 className="text-3xl font-bold text-slate-900">Login</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome back to MedTrack Pro
            </p>

            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-lg"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login"}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <p className="text-xs text-muted-foreground">OR</p>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="flex justify-start">
              <GoogleLogin
                onSuccess={async (cred) => {
                  try {
                    setError("");
                    if (!cred.credential) throw new Error("No ID token");
                    await googleLogin(cred.credential);
                    setLocation("/dashboard");
                  } catch {
                    setError("Google login failed");
                  }
                }}
                onError={() => setError("Google login failed")}
              />
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Don’t have an account?{" "}
              <Link href="/register" className="text-blue-600 font-medium">
                Create account
              </Link>
            </p>
          </div>

          {/* RIGHT IMAGE */}
          <div className="hidden md:block bg-gradient-to-br from-blue-50 to-blue-100 p-8">
            <div className="h-full w-full flex items-center justify-center">
              <img
                src={loginImg}
                alt="Login Illustration"
                className="max-h-[520px] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
