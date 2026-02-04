import { useState } from "react";
import { useLocation } from "wouter";
import api from "@/api/axios";

const VerifyEmail = () => {
    const [, setLocation] = useLocation(); // ✅ WOUTER
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            await api.post("/auth/verify-email/", { email, otp });
            setStatus("success");
            setMessage("Your email has been verified successfully.");

            setTimeout(() => {
                setLocation("/login"); // ✅
            }, 3000);
        } catch (err: any) {
            setStatus("error");
            setMessage(
                err.response?.data?.error ||
                "Invalid or expired verification code."
            );
        }
    };

    const handleResend = async () => {
        if (!email) {
            setMessage("Please enter your email first.");
            setStatus("error");
            return;
        }

        try {
            await api.post("/auth/resend-otp/", { email });
            setMessage("A new verification code has been sent.");
            setStatus("idle");
        } catch {
            setMessage("Failed to resend verification code.");
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <h2 className="text-2xl font-semibold mb-2 text-gray-800">
                    Verify Your Email
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    Enter the 6-digit code sent to your email
                </p>

                {message && (
                    <div className="mb-4 rounded-md p-3 text-sm">
                        {message}
                    </div>
                )}

                {status === "success" ? (
                    <p className="text-sm text-gray-600">Redirecting to login…</p>
                ) : (
                    <form onSubmit={handleVerify} className="space-y-4">
                        <input
                            type="email"
                            placeholder="Email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-3 py-2 border rounded-md"
                        />

                        <input
                            type="text"
                            placeholder="6-digit verification code"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            required
                            className="w-full px-3 py-2 border rounded-md text-center tracking-widest"
                        />

                        <button
                            type="submit"
                            disabled={status === "loading"}
                            className="w-full py-2 bg-blue-600 text-white rounded-md"
                        >
                            {status === "loading" ? "Verifying…" : "Verify Email"}
                        </button>

                        <button
                            type="button"
                            onClick={handleResend}
                            className="w-full text-sm text-blue-600"
                        >
                            Resend verification code
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
