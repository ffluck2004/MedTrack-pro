import { useState } from "react";
import { useLocation, Link, Redirect } from "wouter";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
    const { login, googleLogin, user } = useAuth();
    const [, setLocation] = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    if (user) return <Redirect to="/dashboard" />;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            await login(email, password);
            setLocation("/dashboard");
        } catch (err: any) {
            const msg =
                err?.response?.data?.error ||
                err?.response?.data?.detail ||
                err?.response?.data?.non_field_errors?.[0] ||
                "Invalid email or password";

            setError(msg);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-semibold mb-6 text-center">
                    Welcome back
                </h2>

                {error && (
                    <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        required
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        required
                    />

                    <button className="w-full bg-blue-600 text-white py-2 rounded">
                        Sign in
                    </button>
                </form>

                <div className="my-6 text-center text-sm text-gray-500">
                    or continue with
                </div>

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

                <p className="mt-6 text-sm text-center">
                    New here?{" "}
                    <Link href="/register" className="text-blue-600">
                        Create account
                    </Link>
                </p>
            </div>
        </div>
    );
}
