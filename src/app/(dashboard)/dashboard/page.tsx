"use client";

import { useCallback, useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

type Stats = {
  totalOrders: number;
  orderChangePct: number;
  averageOrderValue: number;
  totalSales: number;
  newClients: number;
  returningClients: number;
  salesByDay: { date: string; total: number }[];
  paidOrderRows: {
    id: string;
    siteName: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    createdAt: string;
    total: number;
  }[];
};

const ranges = [
  { label: "All time", days: 0 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "24 hrs", days: 1 },
];

export default function DashboardPage() {
  const [days, setDays] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/dashboard?days=${days}`, { credentials: "include" });
    if (res.ok) setStats((await res.json()) as Stats);
  }, [days]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 30000);
    const onOrders = () => void load();
    window.addEventListener("mcp:orders-updated", onOrders);
    return () => {
      clearInterval(id);
      window.removeEventListener("mcp:orders-updated", onOrders);
    };
  }, [load]);

  const maxSales = Math.max(...(stats?.salesByDay.map((d) => d.total) ?? [1]), 1);

  return (
    <div className="min-w-0 max-w-full p-4 md:p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Performance Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--mo-muted)]">
            Real-time operational metrics across all restaurant locations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ranges.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() => setDays(r.days)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                days === r.days
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-600 ring-1 ring-gray-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-[var(--mo-border)] bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500">TOTAL PAID ORDERS</p>
            <p className="mt-2 text-4xl font-semibold">{stats?.totalOrders ?? "—"}</p>
            <p
              className={`mt-2 text-sm ${
                (stats?.orderChangePct ?? 0) < 0 ? "text-red-500" : "text-emerald-600"
              }`}
            >
              {(stats?.orderChangePct ?? 0) >= 0 ? "↗" : "↘"}{" "}
              {Math.abs(stats?.orderChangePct ?? 0).toFixed(1)}% vs prev. period
            </p>
          </div>
          <div className="rounded-lg bg-gray-100 p-3 text-gray-500">
            <ShoppingCart className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--mo-border)] bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-medium">Sales (USD)</h2>
              <p className="text-xs text-gray-500">
                {days === 0 ? "ALL PAID ORDERS (by week)" : `LAST ${days} DAYS`}
              </p>
            </div>
            <div className="shrink-0 text-right text-sm">
              <p className="text-gray-500">AVERAGE VALUE</p>
              <p className="font-semibold">
                $ {(stats?.averageOrderValue ?? 0).toFixed(2)}
              </p>
              <p className="mt-1 text-gray-500">TOTAL</p>
              <p className="font-semibold">$ {(stats?.totalSales ?? 0).toFixed(2)}</p>
            </div>
          </div>
          <div className="min-w-0 overflow-x-auto pb-1">
            <div
              className="flex h-44 min-w-full items-end gap-2 px-1"
              style={{
                width: `${Math.max((stats?.salesByDay.length ?? 0) * 44, 280)}px`,
              }}
            >
              {(stats?.salesByDay ?? []).map((d) => (
                <div
                  key={d.date}
                  className="flex w-9 shrink-0 flex-col items-center gap-1"
                >
                  <div
                    className="w-full min-h-[8px] rounded-t bg-[var(--mo-teal)]"
                    style={{ height: `${Math.max(8, (d.total / maxSales) * 120)}px` }}
                    title={`$${d.total.toFixed(2)}`}
                  />
                  <span className="max-w-[2.25rem] truncate text-center text-[9px] leading-tight text-gray-400">
                    {new Date(d.date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--mo-border)] bg-white p-6 shadow-sm">
          <h2 className="font-medium">Clients</h2>
          <p className="text-xs text-gray-500">
            {days === 0 ? "ALL PAID ORDERS" : `LAST ${days} DAYS`}
          </p>
          <div className="mt-6 flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-semibold text-[var(--mo-teal-dark)]">
                {stats?.newClients ?? 0}
              </p>
              <p className="text-xs text-gray-500">NEW</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">{stats?.returningClients ?? 0}</p>
              <p className="text-xs text-gray-500">RETURNING</p>
            </div>
          </div>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--mo-border)] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--mo-border)] px-4 py-4 md:px-6">
          <div>
            <h2 className="font-medium">Paid orders — all sites</h2>
            <p className="text-xs text-gray-500">
              Each row is one paid order from any connected restaurant.
            </p>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            Total: {stats?.totalOrders ?? 0} orders · $
            {(stats?.totalSales ?? 0).toFixed(2)}
          </span>
        </div>
        <div className="max-h-[520px] overflow-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 md:px-6">Restaurant</th>
                <th className="px-3 py-3">Order #</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Phone</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3 md:pr-6">Total</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.paidOrderRows ?? []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                    No paid orders in this time range.
                  </td>
                </tr>
              ) : (
                stats?.paidOrderRows.map((o) => (
                  <tr key={`${o.siteName}-${o.id}`} className="border-t border-gray-100">
                    <td className="max-w-[140px] truncate px-4 py-3 font-medium md:px-6" title={o.siteName}>
                      {o.siteName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                      {o.orderNumber}
                    </td>
                    <td className="max-w-[120px] truncate px-3 py-3" title={o.customerName}>
                      {o.customerName}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{o.customerPhone}</td>
                    <td className="max-w-[160px] truncate px-3 py-3" title={o.customerEmail}>
                      {o.customerEmail}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-600">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 font-medium md:pr-6">
                      $ {o.total.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t px-4 py-3 text-xs text-gray-500 md:px-6">
          Showing {stats?.paidOrderRows.length ?? 0} of {stats?.totalOrders ?? 0} paid
          orders
        </p>
      </div>
    </div>
  );
}
