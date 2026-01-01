import { useState } from "react";
import { Link } from "wouter";
import api from "../api/axios";

const Register = () => {
    const [form, setForm] = useState({
        email: "",
        username: "",
        phone: "",
        password: "",
        role: "STAFF",
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e: any) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        try {
            await api.post("/auth/register/", form);
            setMessage("Account created. Please check your email to verify.");
        } catch {
            setError("Registration failed. Try again.");
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
                            Start managing smarter.
                        </h1>
                        <p className="text-sm opacity-90">
                            Create your MedTrack Pro account and manage pharmacy operations
                            securely and efficiently.
                        </p>
                    </div>

                    <p className="text-xs opacity-75">
                        © {new Date().getFullYear()} MedTrack Pro
                    </p>
                </div>

                {/* RIGHT PANEL */}
                <div className="p-8">
                    <h2 className="text-2xl font-semibold mb-1">Create account</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Please fill in the details below
                    </p>

                    {error && (
                        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-600 border border-green-200">
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            name="username"
                            placeholder="Username"
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />

                        <input
                            name="email"
                            type="email"
                            placeholder="Email"
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />

                        <input
                            name="phone"
                            placeholder="Phone"
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />

                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        />

                        <select
                            name="role"
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-md"
                        >
                            <option value="STAFF">Staff</option>
                            <option value="ADMIN">Admin</option>
                        </select>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-60"
                        >
                            {loading ? "Creating..." : "Create Account"}
                        </button>
                    </form>

                    <p className="text-sm text-center text-gray-500 mt-6">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-600 hover:underline">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
