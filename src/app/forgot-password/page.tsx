"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send OTP");
        return;
      }
      router.push(`/forgot-password/verify?email=${encodeURIComponent(email)}`);
    } catch {
      setError("Could not reach server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we will send a one-time code"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="text-xs font-medium tracking-wide text-gray-500">
            EMAIL ADDRESS
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--mo-teal-dark)]"
            required
          />
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--mo-teal)] py-3 text-sm font-medium text-gray-800 hover:bg-[var(--mo-teal-dark)] disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send OTP"}
        </button>
        <Link href="/login" className="block text-center text-sm text-[var(--mo-teal-dark)]">
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}
