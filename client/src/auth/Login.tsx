import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const { login } = useAuth();
    const [, setLocation] = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            setLocation("/");
        } catch {
            setError("Invalid credentials or email not verified.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg grid grid-cols-1 md:grid-cols-2 overflow-hidden">

                {/* LEFT PANEL */}
                <div className="hidden md:flex flex-col justify-between p-8 text-white bg-gradient-to-br from-blue-600 to-indigo-700">
                    <div>
                        <h1 className="text-3xl font-bold mb-3">
                            Manage medicines smarter, not harder.
                        </h1>
                        <p className="text-sm opacity-90">
                            MedTrack Pro helps pharmacies track inventory, billing, and reports
                            securely — all in one place.
                        </p>
                    </div>

                    <p className="text-xs opacity-75">
                        © {new Date().getFullYear()} MedTrack Pro
                    </p>
                </div>

                {/* RIGHT PANEL */}
                <div className="p-8">
                    <h2 className="text-2xl font-semibold mb-1">Welcome back</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Please login to your account
                    </p>

                    {error && (
                        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm mb-1 text-gray-600">
                                Email address
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm mb-1 text-gray-600">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center gap-2 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60"
                        >
                            {loading ? (
                                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                "Login"
                            )}
                        </button>
                    </form>

                    <p className="text-sm text-center text-gray-500 mt-6">
                        Don’t have an account?{" "}
                        <Link href="/register" className="text-blue-600 hover:underline">
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
