import { siteDb } from "@/lib/mongodb";
import type { SiteConfig } from "@/models/site";

export type UnifiedOrder = {
  id: string;
  siteId: string;
  siteName: string;
  createdAt: string;
  total?: number;
  customerName?: string;
  customerPhone?: string;
  raw: Record<string, unknown>;
};

function paidFilter(site: SiteConfig): Record<string, unknown> {
  if (site.paidFilterJson) {
    return JSON.parse(site.paidFilterJson) as Record<string, unknown>;
  }
  const field = site.paidStatusField ?? "paymentStatus";
  const value = site.paidStatusValue ?? "paid";
  return { [field]: value };
}

export async function fetchPaidOrdersForSite(
  site: SiteConfig,
  since?: Date
): Promise<UnifiedOrder[]> {
  const db = siteDb(site.databaseName);
  const collection = db.collection(site.ordersCollection ?? "orders");

  const query: Record<string, unknown> = { ...paidFilter(site) };
  const dateField = site.orderDateField ?? "createdAt";
  if (since) {
    query[dateField] = { $gt: since };
  }

  const docs = await collection
    .find(query)
    .sort({ [dateField]: -1 })
    .limit(since ? 500 : 200)
    .toArray();

  return docs.map((doc) => {
    const id = String(doc._id);
    const created = doc[dateField];
    const createdAt =
      created instanceof Date
        ? created.toISOString()
        : typeof created === "string"
          ? created
          : new Date().toISOString();

    return {
      id,
      siteId: String(site._id),
      siteName: site.name,
      createdAt,
      total: typeof doc.total === "number" ? doc.total : undefined,
      customerName:
        typeof doc.customerName === "string"
          ? doc.customerName
          : typeof doc.name === "string"
            ? doc.name
            : undefined,
      customerPhone:
        typeof doc.phone === "string"
          ? doc.phone
          : typeof doc.customerPhone === "string"
            ? doc.customerPhone
            : undefined,
      raw: doc as Record<string, unknown>,
    };
  });
}

export async function fetchAllPaidOrders(
  sites: SiteConfig[],
  since?: Date
): Promise<UnifiedOrder[]> {
  const results = await Promise.allSettled(
    sites.map((site) => fetchPaidOrdersForSite(site, since))
  );

  const batches: UnifiedOrder[][] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      batches.push(result.value);
    } else {
      console.error("Failed to load orders for a site:", result.reason);
    }
  }

  return batches
    .flat()
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}
