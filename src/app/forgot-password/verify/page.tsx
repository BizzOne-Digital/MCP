"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Reset failed");
        return;
      }
      router.replace("/login");
    } catch {
      setError("Could not reach server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Reset password" subtitle={`Enter the OTP sent to ${email}`}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium tracking-wide text-gray-500">OTP CODE</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm tracking-[0.3em]"
            placeholder="000000"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium tracking-wide text-gray-500">NEW PASSWORD</label>
          <div className="relative mt-1.5">
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 pr-10 text-sm"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium tracking-wide text-gray-500">
            CONFIRM PASSWORD
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
            minLength={6}
            required
          />
        </div>
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button
          type="submit"
          disabled={loading || !email}
          className="w-full rounded-lg bg-[var(--mo-teal)] py-3 text-sm font-medium text-gray-800 disabled:opacity-60"
        >
          {loading ? "Saving…" : "Update password"}
        </button>
        <Link href="/login" className="block text-center text-sm text-[var(--mo-teal-dark)]">
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
