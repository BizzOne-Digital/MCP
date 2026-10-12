"use client";

import { Eye, EyeOff, X } from "lucide-react";
import { useState } from "react";

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Pakistan"];

export function CreateRestaurantModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [country, setCountry] = useState("United States");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: businessName,
          fullName,
          contactPhone: contact,
          country,
          adminEmail: email,
          adminPassword: password,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create restaurant");
        return;
      }
      onCreated();
      onClose();
      setFullName("");
      setBusinessName("");
      setContact("");
      setEmail("");
      setPassword("");
      setConfirm("");
    } catch {
      setError("Could not reach server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Create New Restaurant</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          {[
            { label: "FULL NAME *", value: fullName, set: setFullName },
            { label: "BUSINESS NAME *", value: businessName, set: setBusinessName },
            {
              label: "CONTACT NUMBER (OPTIONAL)",
              value: contact,
              set: setContact,
              optional: true,
            },
            { label: "EMAIL *", value: email, set: setEmail, type: "email" },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs font-medium text-gray-500">{f.label}</label>
              <input
                type={f.type ?? "text"}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                required={!f.optional}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-gray-500">CREATE PASSWORD *</label>
            <div className="relative mt-1">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm"
                minLength={6}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                onClick={() => setShowPass((s) => !s)}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">CONFIRM PASSWORD *</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Country *</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {COUNTRIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <div className="flex items-center justify-end gap-4 pt-2">
            <button type="button" onClick={onClose} className="text-sm text-[var(--mo-teal-dark)]">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[var(--mo-teal)] px-6 py-2 text-sm font-medium text-gray-800 disabled:opacity-60"
            >
              {loading ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
