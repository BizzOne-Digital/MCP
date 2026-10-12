"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { CreateRestaurantModal } from "@/components/CreateRestaurantModal";

type Site = {
  _id: string;
  name: string;
  slug: string;
  databaseName: string;
  createdAt?: string;
  isActive?: boolean;
  storedAdminEmail?: string;
  storedAdminPassword?: string;
  country?: string;
};

export default function RestaurantsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [credEmail, setCredEmail] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);
  const [credMsg, setCredMsg] = useState("");
  const [siteOrders, setSiteOrders] = useState<
    {
      id: string;
      orderNumber?: string;
      customerName?: string;
      customerPhone?: string;
      customerEmail?: string;
      createdAt: string;
      total: number;
    }[]
  >([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const loadSites = useCallback(async () => {
    const res = await fetch("/api/sites", { credentials: "include" });
    if (res.ok) {
      const data = (await res.json()) as { sites: Site[] };
      setSites(data.sites ?? []);
    }
  }, []);

  useEffect(() => {
    void loadSites();
  }, [loadSites]);

  const loadCreds = useCallback(async (siteId: string) => {
    const res = await fetch(`/api/sites/${siteId}/credentials`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const data = (await res.json()) as {
      currentEmail?: string;
      currentPassword?: string;
    };
    setCurrentEmail(data.currentEmail ?? null);
    setCurrentPassword(data.currentPassword ?? null);
    if (data.currentEmail) setCredEmail(data.currentEmail);
  }, []);

  const loadSiteOrders = useCallback(async (siteId: string) => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`/api/orders?siteId=${siteId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setSiteOrders([]);
        return;
      }
      const data = (await res.json()) as {
        orders?: {
          id: string;
          orderNumber?: string;
          customerName?: string;
          customerPhone?: string;
          customerEmail?: string;
          createdAt: string;
          total: number;
        }[];
      };
      setSiteOrders(data.orders ?? []);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setSiteOrders([]);
      return;
    }
    void loadCreds(selectedId);
    void loadSiteOrders(selectedId);
  }, [selectedId, loadCreds, loadSiteOrders]);

  useEffect(() => {
    const refresh = () => {
      if (selectedId) void loadSiteOrders(selectedId);
    };
    window.addEventListener("mcp:orders-updated", refresh);
    return () => window.removeEventListener("mcp:orders-updated", refresh);
  }, [selectedId, loadSiteOrders]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sites.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.slug.includes(q) ||
        (s.storedAdminEmail ?? "").toLowerCase().includes(q) ||
        s._id.includes(q)
    );
  }, [sites, search]);

  async function toggleActive(site: Site) {
    await fetch(`/api/sites/${site._id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !site.isActive }),
    });
    await loadSites();
  }

  async function updateCreds(e: React.FormEvent) {
    e.preventDefault();
    setCredMsg("");
    const res = await fetch(`/api/sites/${selectedId}/credentials`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: credEmail, password: credPassword }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setCredMsg(data.error ?? "Update failed");
      return;
    }
    setCurrentEmail(credEmail);
    setCurrentPassword(credPassword);
    setCredPassword("");
    setCredMsg("Credentials updated.");
    await loadSites();
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Manage Restaurants</h1>
        <p className="mt-1 text-sm text-[var(--mo-muted)]">
          Efficiency streamlined: manage and view list of all Restaurant/Outlet here.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Email, Website or Admin ID"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--mo-teal)] px-4 py-2.5 text-sm font-medium text-gray-800"
        >
          <Plus className="h-4 w-4" />
          Create new restaurant
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-[var(--mo-border)] bg-white shadow-sm xl:col-span-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Restaurant name</th>
                <th className="px-4 py-3">Admin ID</th>
                <th className="px-4 py-3">Email ID</th>
                <th className="px-4 py-3">Registration date</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Orders</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s._id}
                  className={`border-t border-gray-100 hover:bg-gray-50 ${
                    selectedId === s._id ? "bg-teal-50/50" : ""
                  }`}
                >
                  <td
                    className="cursor-pointer px-4 py-3 font-medium"
                    onClick={() => setSelectedId(s._id)}
                  >
                    {s.name}
                  </td>
                  <td
                    className="cursor-pointer px-4 py-3 text-gray-500"
                    onClick={() => setSelectedId(s._id)}
                  >
                    {s._id.slice(-8)}
                  </td>
                  <td
                    className="cursor-pointer px-4 py-3"
                    onClick={() => setSelectedId(s._id)}
                  >
                    {s.storedAdminEmail ?? "—"}
                  </td>
                  <td
                    className="cursor-pointer px-4 py-3 text-gray-500"
                    onClick={() => setSelectedId(s._id)}
                  >
                    {s.createdAt
                      ? new Date(s.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td
                    className="cursor-pointer px-4 py-3"
                    onClick={() => setSelectedId(s._id)}
                  >
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs">FREE</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleActive(s);
                      }}
                      className={`h-6 w-11 rounded-full transition ${
                        s.isActive ? "bg-[var(--mo-teal)]" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition ${
                          s.isActive ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedId(s._id)}
                      className="text-sm font-medium text-[var(--mo-teal-dark)] hover:underline"
                    >
                      Open orders
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t px-4 py-3 text-xs text-gray-500">
            Showing {filtered.length} of {sites.length} records
          </p>
        </div>

        <div className="rounded-xl border border-[var(--mo-border)] bg-white p-5 shadow-sm">
          <h2 className="font-medium">Update site admin login</h2>
          <form onSubmit={updateCreds} className="mt-4 space-y-3 text-sm">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
              required
            >
              <option value="">Select site</option>
              {sites.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            {selectedId ? (
              <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <p>Current email: {currentEmail ?? "—"}</p>
                <p className="mt-1">Current password: {currentPassword ?? "—"}</p>
              </div>
            ) : null}
            <input
              type="email"
              value={credEmail}
              onChange={(e) => setCredEmail(e.target.value)}
              placeholder="New admin email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
              required
              disabled={!selectedId}
            />
            <input
              type="password"
              value={credPassword}
              onChange={(e) => setCredPassword(e.target.value)}
              placeholder="New admin password"
              className="w-full rounded-lg border border-gray-200 px-3 py-2"
              minLength={6}
              required
              disabled={!selectedId}
            />
            <button
              type="submit"
              disabled={!selectedId}
              className="w-full rounded-lg bg-[var(--mo-teal)] py-2 font-medium text-gray-800 disabled:opacity-50"
            >
              Update credentials
            </button>
            {credMsg ? <p className="text-gray-500">{credMsg}</p> : null}
          </form>
        </div>
      </div>

      {selectedId ? (
        <div className="mt-6 min-w-0 overflow-hidden rounded-xl border border-[var(--mo-border)] bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-4 md:px-6">
            <div>
              <h2 className="font-medium">
                Paid orders — {sites.find((s) => s._id === selectedId)?.name ?? "Restaurant"}
              </h2>
              <p className="text-xs text-gray-500">Only paid orders for this site</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
              {ordersLoading ? "Loading…" : `${siteOrders.length} orders`}
            </span>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 md:px-6">Order #</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Phone</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3 md:pr-6">Total</th>
                </tr>
              </thead>
              <tbody>
                {!ordersLoading && siteOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No paid orders for this restaurant yet.
                    </td>
                  </tr>
                ) : (
                  siteOrders.map((o) => (
                    <tr key={o.id} className="border-t border-gray-100">
                      <td className="whitespace-nowrap px-4 py-3 md:px-6">
                        {o.orderNumber ?? o.id.slice(-8)}
                      </td>
                      <td className="px-3 py-3">{o.customerName ?? "—"}</td>
                      <td className="whitespace-nowrap px-3 py-3">
                        {o.customerPhone ?? "—"}
                      </td>
                      <td className="max-w-[160px] truncate px-3 py-3">
                        {o.customerEmail ?? "—"}
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
        </div>
      ) : null}

      <CreateRestaurantModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => void loadSites()}
      />
    </div>
  );
}
