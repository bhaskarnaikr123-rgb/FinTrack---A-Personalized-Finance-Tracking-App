
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 8 || password.length > 72) {
            setError("Password must contain between 8 and 72 characters.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                }),
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const detail = data?.detail;

                const message =
                    typeof detail === "string"
                        ? detail
                        : Array.isArray(detail)
                            ? detail.map((item: { msg?: string }) => item.msg || "Invalid input").join(", ")
                            : "Registration failed. Please try again.";

                throw new Error(message);
            }

            router.push("/login?registered=true");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to connect to the server."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <Link href="/" className="text-xl font-bold text-slate-900">
                    Fin<span className="text-emerald-600">Track</span>
                </Link>

                <h1 className="mt-8 text-3xl font-bold text-slate-900">
                    Create your account
                </h1>

                <p className="mt-2 text-slate-600">
                    Start tracking your finances smarter.
                </p>

                {error && (
                    <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div>
                        <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                            Full name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            minLength={2}
                            maxLength={100}
                            required
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={72}
                            placeholder="At least 8 characters"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
                            Confirm password
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={72}
                            placeholder="Re-enter your password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            required
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                    Already have an account?{" "}
                    <Link href="/login" className="font-semibold text-emerald-700 hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}
