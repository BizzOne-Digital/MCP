"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

const TIMEZONES = ["Asia/Karachi", "America/Toronto", "America/New_York", "UTC"];
const CURRENCIES = ["USD", "CAD", "PKR", "GBP"];

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [currency, setCurrency] = useState("USD");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void fetch("/api/account", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { email?: string; timezone?: string; currency?: string }) => {
        setEmail(d.email ?? "");
        setTimezone(d.timezone ?? "Asia/Karachi");
        setCurrency(d.currency ?? "USD");
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/account", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone, currency }),
    });
    if (res.ok) setMsg("Changes saved.");
    else setMsg("Could not save.");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold">My Account</h1>
      <p className="mt-1 text-sm text-[var(--mo-muted)]">Manage your display preferences.</p>

      <form
        onSubmit={save}
        className="mt-8 max-w-3xl rounded-xl border border-[var(--mo-border)] bg-white p-6 shadow-sm"
      >
        <p className="text-xs font-medium text-gray-500">ACCOUNT INFORMATION</p>
        <div className="mt-4">
          <label className="text-xs font-medium text-gray-500">EMAIL ADDRESS</label>
          <input
            value={email}
            disabled
            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
          />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-gray-500">TIMEZONE</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz}>{tz}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              All dates & times are shown in this timezone.
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">CURRENCY</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 rounded-lg border border-[var(--mo-teal)]/40 bg-[var(--mo-teal)]/10 px-4 py-3 text-sm text-gray-700">
          Currency Display Notice: Changing your preferred currency only updates the
          currency label and symbol displayed throughout the dashboard.
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--mo-teal)] px-5 py-2 text-sm font-medium text-gray-800"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
        {msg ? <p className="mt-3 text-sm text-gray-500">{msg}</p> : null}
      </form>
    </div>
  );
}
