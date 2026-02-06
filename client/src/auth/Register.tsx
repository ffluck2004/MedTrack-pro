import { useState } from "react";
import { Link, useLocation } from "wouter";
import api from "@/api/axios";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
    const [, setLocation] = useLocation();
    const { googleLogin } = useAuth();

    const [form, setForm] = useState({
        email: "",
        username: "",
        password: "",
    });

    const [error, setError] = useState("");

    const submit = async () => {
        setError("");

        try {
            await api.post("/auth/register/", form);
            setLocation("/login");
        } catch (err: any) {
            const msg =
                err?.response?.data?.email?.[0] ||
                err?.response?.data?.username?.[0] ||
                err?.response?.data?.detail ||
                "Registration failed";

            setError(msg);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
                <h2 className="text-xl font-semibold mb-4">Create account</h2>

                {error && (
                    <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                    </div>
                )}

                <input
                    placeholder="Email"
                    className="w-full mb-3 border px-3 py-2 rounded"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                />

                <input
                    placeholder="Username"
                    className="w-full mb-3 border px-3 py-2 rounded"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                />

                <input
                    type="password"
                    placeholder="Password"
                    className="w-full mb-3 border px-3 py-2 rounded"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                />

                <button
                    onClick={submit}
                    className="w-full bg-blue-600 text-white py-2 rounded"
                >
                    Create account
                </button>

                <div className="my-4 text-center text-sm text-gray-500">
                    or sign up with
                </div>

                <GoogleLogin
                    onSuccess={async (cred) => {
                        if (!cred.credential) return;
                        await googleLogin(cred.credential);
                        setLocation("/dashboard");
                    }}
                />

                <p className="mt-4 text-sm text-center">
                    Already registered?{" "}
                    <Link href="/login" className="text-blue-600">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
