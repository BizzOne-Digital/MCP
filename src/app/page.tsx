"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { slugFromName } from "@/lib/slug";
import {
  MCP_NETWORK_ERROR,
  isMcpNetworkError,
  mcpFetch,
  mcpJson,
} from "@/lib/mcp-fetch";

type Site = {
  _id: string;
  name: string;
  slug: string;
  databaseName: string;
};

type Order = {
  id: string;
  siteId: string;
  siteName: string;
  createdAt: string;
  total?: number;
  customerName?: string;
  customerPhone?: string;
};

function playNotification() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  gain.gain.value = 0.15;
  osc.start();
  osc.stop(ctx.currentTime + 0.25);
  setTimeout(() => {
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.frequency.value = 1175;
    gain2.gain.value = 0.15;
    osc2.start();
    osc2.stop(ctx.currentTime + 0.35);
  }, 280);
}

export default function DashboardPage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [credSiteId, setCredSiteId] = useState("");
  const [credEmail, setCredEmail] = useState("");
  const [credPassword, setCredPassword] = useState("");
  const [credMsg, setCredMsg] = useState("");
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);
  const [currentAdminPassword, setCurrentAdminPassword] = useState<string | null>(
    null
  );
  const [newSiteName, setNewSiteName] = useState("");
  const [siteMsg, setSiteMsg] = useState("");
  const [editSiteId, setEditSiteId] = useState("");
  const [editSiteName, setEditSiteName] = useState("");
  const [editDatabaseName, setEditDatabaseName] = useState("");
  const [editSiteMsg, setEditSiteMsg] = useState("");
  const [clusterDatabases, setClusterDatabases] = useState<string[]>([]);
  const [ordersTab, setOrdersTab] = useState<"all" | "bySite">("all");
  const [viewingSiteId, setViewingSiteId] = useState<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const ordersFetchInFlightRef = useRef(false);
  const [addingSite, setAddingSite] = useState(false);

  const viewingSite = sites.find((s) => s._id === viewingSiteId);
  const displayedOrders =
    ordersTab === "bySite" && viewingSiteId
      ? orders.filter((o) => o.siteId === viewingSiteId)
      : orders;

  const loadSites = useCallback(async () => {
    const result = await mcpJson<{ sites: Site[] }>("/api/sites");
    if (isMcpNetworkError(result)) return;
    if (result.status === 401) {
      router.replace("/login");
      return;
    }
    if (!result.ok) return;
    setSites(result.data.sites ?? []);
  }, [router]);

  const loadDatabases = useCallback(async () => {
    const result = await mcpJson<{ databases?: string[] }>("/api/databases");
    if (!result.ok || isMcpNetworkError(result)) return;
    setClusterDatabases(result.data.databases ?? []);
  }, []);

  const loadOrders = useCallback(
    async (notify: boolean) => {
      if (ordersFetchInFlightRef.current) return;
      ordersFetchInFlightRef.current = true;
      try {
        const result = await mcpJson<{ orders: Order[] }>("/api/orders");
        if (isMcpNetworkError(result)) return;
        if (result.status === 401) {
          router.replace("/login");
          return;
        }
        if (!result.ok) return;
        const list = result.data.orders ?? [];

        if (!initializedRef.current) {
          list.forEach((o) => seenIdsRef.current.add(`${o.siteId}:${o.id}`));
          initializedRef.current = true;
        } else if (notify) {
          for (const o of list) {
            const key = `${o.siteId}:${o.id}`;
            if (!seenIdsRef.current.has(key)) {
              seenIdsRef.current.add(key);
              playNotification();
            }
          }
        }

        setOrders(list);
      } catch {
        /* Failed to fetch — often dev recompile; keep last orders on screen */
      } finally {
        ordersFetchInFlightRef.current = false;
      }
    },
    [router]
  );

  useEffect(() => {
    void (async () => {
      try {
        await loadSites();
        await loadDatabases();
        await loadOrders(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadSites, loadDatabases, loadOrders]);

  const loadCurrentAdminCreds = useCallback(async (siteId: string) => {
    const result = await mcpJson<{
      currentEmail?: string | null;
      currentPassword?: string | null;
    }>(`/api/sites/${siteId}/credentials`);
    if (!result.ok || isMcpNetworkError(result)) return;
    const email = result.data.currentEmail ?? null;
    const password = result.data.currentPassword ?? null;
    setCurrentAdminEmail(email);
    setCurrentAdminPassword(password);
    if (email) setCredEmail(email);
  }, []);

  useEffect(() => {
    if (!credSiteId) {
      setCurrentAdminEmail(null);
      setCurrentAdminPassword(null);
      setCredEmail("");
      setCredPassword("");
      return;
    }
    void loadCurrentAdminCreds(credSiteId);
  }, [credSiteId, loadCurrentAdminCreds]);

  useEffect(() => {
    if (!editSiteId) {
      setEditSiteName("");
      setEditDatabaseName("");
      return;
    }
    const site = sites.find((s) => s._id === editSiteId);
    if (site) {
      setEditSiteName(site.name);
      setEditDatabaseName(site.databaseName);
    }
  }, [editSiteId, sites]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadOrders(true);
    }, 15000);
    return () => window.clearInterval(id);
  }, [loadOrders]);

  async function logout() {
    try {
      await mcpFetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* still leave panel */
    }
    router.replace("/login");
  }

  async function addSite(e: React.FormEvent) {
    e.preventDefault();
    setSiteMsg("");
    const slug = slugFromName(newSiteName);
    if (!slug) {
      setSiteMsg("Enter a valid site name.");
      return;
    }
    setAddingSite(true);
    const result = await mcpJson<{ error?: string }>("/api/sites", {
      method: "POST",
      body: JSON.stringify({ name: newSiteName, slug }),
    });
    setAddingSite(false);
    if (isMcpNetworkError(result)) {
      setSiteMsg(MCP_NETWORK_ERROR);
      return;
    }
    if (result.status === 401) {
      router.replace("/login");
      return;
    }
    if (!result.ok) {
      setSiteMsg(result.data.error ?? "Could not add site");
      return;
    }
    setNewSiteName("");
    setSiteMsg(`Site added. MongoDB database set to "${slug}" (edit below if different).`);
    await loadSites();
    await loadDatabases();
  }

  async function updateSite(e: React.FormEvent) {
    e.preventDefault();
    setEditSiteMsg("");
    const result = await mcpJson<{ error?: string }>(`/api/sites/${editSiteId}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: editSiteName,
        databaseName: editDatabaseName,
      }),
    });
    if (isMcpNetworkError(result)) {
      setEditSiteMsg(MCP_NETWORK_ERROR);
      return;
    }
    if (!result.ok) {
      setEditSiteMsg(result.data.error ?? "Could not update site");
      return;
    }
    setEditSiteMsg("Site updated.");
    await loadSites();
  }

  async function updateCreds(e: React.FormEvent) {
    e.preventDefault();
    setCredMsg("");
    const result = await mcpJson<{ error?: string }>(
      `/api/sites/${credSiteId}/credentials`,
      {
        method: "PATCH",
        body: JSON.stringify({ email: credEmail, password: credPassword }),
      }
    );
    if (isMcpNetworkError(result)) {
      setCredMsg(MCP_NETWORK_ERROR);
      return;
    }
    if (!result.ok) {
      setCredMsg(result.data.error ?? "Update failed");
      return;
    }
    const updated = result.data as {
      currentEmail?: string;
      currentPassword?: string;
    };
    setCurrentAdminEmail(updated.currentEmail ?? credEmail);
    setCurrentAdminPassword(updated.currentPassword ?? credPassword);
    setCredMsg("Admin credentials updated. Use the new email/password on that site’s admin login.");
    setCredPassword("");
  }

  if (loading) {
    return (
      <main className="p-6 text-sm text-zinc-400">Loading panel…</main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Master Control Panel</h1>
        <button
          type="button"
          onClick={() => void logout()}
          className="rounded border border-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-900"
        >
          Log out
        </button>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="font-medium">Add site</h2>
          <form onSubmit={addSite} className="space-y-3 text-sm">
            <input
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
              placeholder="Site name"
              value={newSiteName}
              onChange={(e) => setNewSiteName(e.target.value)}
              required
            />
            <p className="text-xs text-zinc-500">
              Database name is set automatically from the name (same as slug). Change it
              under Update site if your MongoDB uses a different name.
            </p>
            <button
              type="submit"
              disabled={addingSite}
              className="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500 disabled:opacity-50"
            >
              {addingSite ? "Saving…" : "Save site"}
            </button>
            {siteMsg ? (
              <p
                className={
                  siteMsg === MCP_NETWORK_ERROR ? "text-red-400" : "text-zinc-400"
                }
              >
                {siteMsg}
              </p>
            ) : null}
          </form>
        </div>

        <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="font-medium">Update site</h2>
          <form onSubmit={updateSite} className="space-y-3 text-sm">
            <select
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
              value={editSiteId}
              onChange={(e) => setEditSiteId(e.target.value)}
              required
            >
              <option value="">Select site</option>
              {sites.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
              placeholder="Display name"
              value={editSiteName}
              onChange={(e) => setEditSiteName(e.target.value)}
              required
              disabled={!editSiteId}
            />
            <select
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
              value={editDatabaseName}
              onChange={(e) => setEditDatabaseName(e.target.value)}
              required
              disabled={!editSiteId}
            >
              <option value="">MongoDB database</option>
              {editDatabaseName &&
              !clusterDatabases.includes(editDatabaseName) ? (
                <option value={editDatabaseName}>{editDatabaseName}</option>
              ) : null}
              {clusterDatabases.map((db) => (
                <option key={db} value={db}>
                  {db}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500 disabled:opacity-50"
              disabled={!editSiteId}
            >
              Save changes
            </button>
            {editSiteMsg ? <p className="text-zinc-400">{editSiteMsg}</p> : null}
          </form>
        </div>

        <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h2 className="font-medium">Update site admin login</h2>
          <form onSubmit={updateCreds} className="space-y-3 text-sm">
            <select
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
              value={credSiteId}
              onChange={(e) => setCredSiteId(e.target.value)}
              required
            >
              <option value="">Select site</option>
              {sites.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            {credSiteId ? (
              <div className="rounded border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs text-zinc-400">
                <p>
                  <span className="text-zinc-500">Current email: </span>
                  {currentAdminEmail ?? "—"}
                </p>
                <p className="mt-1">
                  <span className="text-zinc-500">Current password: </span>
                  {currentAdminPassword ??
                    "— (update credentials once here to save & show password)"}
                </p>
              </div>
            ) : null}
            <input
              type="email"
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
              placeholder="New admin email"
              value={credEmail}
              onChange={(e) => setCredEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2"
              placeholder="New admin password"
              value={credPassword}
              onChange={(e) => setCredPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="submit"
              className="rounded bg-emerald-600 px-4 py-2 hover:bg-emerald-500"
            >
              Update credentials
            </button>
            {credMsg ? <p className="text-zinc-400">{credMsg}</p> : null}
          </form>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-lg border border-zinc-800 p-1">
            <button
              type="button"
              onClick={() => {
                setOrdersTab("all");
                setViewingSiteId(null);
              }}
              className={`rounded px-3 py-1.5 text-sm ${
                ordersTab === "all"
                  ? "bg-zinc-800 font-medium text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Paid orders (all sites)
            </button>
            <button
              type="button"
              onClick={() => {
                setOrdersTab("bySite");
                setViewingSiteId(null);
              }}
              className={`rounded px-3 py-1.5 text-sm ${
                ordersTab === "bySite"
                  ? "bg-zinc-800 font-medium text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              View orders by sites
            </button>
          </div>
          <span className="text-xs text-zinc-500">Refreshes every 15s · sound on new order</span>
        </div>

        {ordersTab === "bySite" && !viewingSiteId ? (
          <ul className="divide-y divide-zinc-800 text-sm">
            {sites.length === 0 ? (
              <li className="py-6 text-zinc-500">No sites yet. Add a site above.</li>
            ) : (
              sites.map((site) => (
                <li
                  key={site._id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <span className="font-medium">{site.name}</span>
                  <button
                    type="button"
                    onClick={() => setViewingSiteId(site._id)}
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    Open orders
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : (
          <>
            {ordersTab === "bySite" && viewingSite ? (
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewingSiteId(null)}
                  className="text-sm text-zinc-400 hover:text-zinc-200"
                >
                  ← Back to sites
                </button>
                <h2 className="text-sm font-medium">
                  Paid orders — {viewingSite.name}
                </h2>
              </div>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-zinc-400">
                  <tr>
                    {ordersTab === "all" ? (
                      <th className="pb-2 pr-4">Site</th>
                    ) : null}
                    <th className="pb-2 pr-4">Time</th>
                    <th className="pb-2 pr-4">Customer</th>
                    <th className="pb-2 pr-4">Phone</th>
                    <th className="pb-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={ordersTab === "all" ? 5 : 4}
                        className="py-6 text-zinc-500"
                      >
                        {ordersTab === "bySite" && viewingSiteId
                          ? "No paid orders for this site yet."
                          : "No paid orders yet. Add sites with the correct database names."}
                      </td>
                    </tr>
                  ) : (
                    displayedOrders.map((o) => (
                      <tr
                        key={`${o.siteId}-${o.id}`}
                        className="border-t border-zinc-800"
                      >
                        {ordersTab === "all" ? (
                          <td className="py-2 pr-4">{o.siteName}</td>
                        ) : null}
                        <td className="py-2 pr-4">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4">{o.customerName ?? "—"}</td>
                        <td className="py-2 pr-4">{o.customerPhone ?? "—"}</td>
                        <td className="py-2">{o.total ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
