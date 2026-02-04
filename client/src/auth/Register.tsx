import { useState } from "react";
import { Link, useLocation } from "wouter";
import api from "@/api/axios";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
    const [, setLocation] = useLocation();
    const { googleLogin } = useAuth();

    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        email: "",
        username: "",
        password: "",
    });
    const [error, setError] = useState("");

    const next = () => setStep((s) => s + 1);

    const submit = async () => {
        try {
            await api.post("/auth/register/", form);
            setLocation("/login");
        } catch (err: any) {
            setError("User already exists");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
                <h2 className="text-xl font-semibold mb-4">
                    Create account (Step {step}/3)
                </h2>

                {error && (
                    <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <>
                        <input
                            placeholder="Email"
                            className="w-full mb-3 border px-3 py-2 rounded"
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />
                        <button onClick={next} className="btn-primary">
                            Next
                        </button>
                    </>
                )}

                {step === 2 && (
                    <>
                        <input
                            placeholder="Username"
                            className="w-full mb-3 border px-3 py-2 rounded"
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                        />
                        <button onClick={next} className="btn-primary">
                            Next
                        </button>
                    </>
                )}

                {step === 3 && (
                    <>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full mb-3 border px-3 py-2 rounded"
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                        <button onClick={submit} className="btn-primary">
                            Create account
                        </button>
                    </>
                )}

                <div className="my-4 text-center text-sm text-gray-500">
                    or sign up with
                </div>

                <GoogleLogin
                    onSuccess={(cred) => {
                        if (cred.credential) {
                            googleLogin(cred.credential).then(() => setLocation("/"));
                        }
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
