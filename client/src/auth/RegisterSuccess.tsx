import { Link } from "wouter";

export default function RegisterSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-semibold mb-3 text-gray-800">
          Verify your email
        </h1>
        <p className="text-gray-600 text-sm mb-6">
          We’ve sent a verification link to your email address.  
          Please verify your account before logging in.
        </p>

        <Link
          href="/login"
          className="inline-block mt-2 text-blue-600 hover:underline text-sm"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
