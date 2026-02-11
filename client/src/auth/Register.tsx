import { useState } from "react";
import { Link, useLocation } from "wouter";
import api from "@/api/axios";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

import registerImg from "@/assets/register-illustration.png";

export default function Register() {
    const [, setLocation] = useLocation();
    const { googleLogin } = useAuth();

    const [form, setForm] = useState({
        email: "",
        username: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        setError("");
        setLoading(true);

        try {
            await api.post("/auth/register/", form);
            setLocation("/login");
        } catch (err: any) {
            const msg =
                err?.response?.data?.email?.[0] ||
                err?.response?.data?.username?.[0] ||
                err?.response?.data?.non_field_errors?.[0] ||
                err?.response?.data?.detail ||
                "Registration failed";

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
                        <h1 className="text-3xl font-bold text-slate-900">
                            Create account
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Start using MedTrack Pro in minutes
                        </p>

                        {error && (
                            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <div className="mt-8 space-y-4">
                            <div>
                                <label className="text-sm font-medium">Email</label>
                                <input
                                    placeholder="Enter email"
                                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({ ...form, email: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Username</label>
                                <input
                                    placeholder="Choose a username"
                                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={form.username}
                                    onChange={(e) =>
                                        setForm({ ...form, username: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Password</label>
                                <input
                                    type="password"
                                    placeholder="Create a password"
                                    className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({ ...form, password: e.target.value })
                                    }
                                />
                            </div>

                            <Button
                                onClick={submit}
                                className="w-full rounded-lg"
                                disabled={loading}
                            >
                                {loading ? "Creating..." : "Create account"}
                            </Button>
                        </div>

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
                                        setError("Google signup failed");
                                    }
                                }}
                                onError={() => setError("Google signup failed")}
                            />
                        </div>

                        <p className="mt-6 text-sm text-muted-foreground">
                            Already registered?{" "}
                            <Link href="/login" className="text-blue-600 font-medium">
                                Login
                            </Link>
                        </p>
                    </div>

                    {/* RIGHT IMAGE */}
                    <div className="hidden md:block bg-gradient-to-br from-blue-50 to-blue-100 p-8">
                        <div className="h-full w-full flex items-center justify-center">
                            <img
                                src={registerImg}
                                alt="Register Illustration"
                                className="max-h-[520px] w-auto object-contain"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
