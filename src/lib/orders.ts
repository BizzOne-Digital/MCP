import { siteDb } from "@/lib/mongodb";
import type { SiteConfig } from "@/models/site";
import {
  extractCustomerName,
  extractCustomerPhone,
  extractOrderDate,
  extractOrderTotal,
} from "@/lib/order-fields";

export type UnifiedOrder = {
  id: string;
  orderNumber?: string;
  siteId: string;
  siteName: string;
  createdAt: string;
  total: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentStatus?: string;
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
    .limit(since ? 500 : 10_000)
    .toArray();

  return docs.map((doc) => {
    const raw = doc as Record<string, unknown>;
    const id = String(doc._id);
    const createdAt = extractOrderDate(raw, dateField).toISOString();

    return {
      id,
      orderNumber:
        typeof raw.orderNumber === "string" ? raw.orderNumber : undefined,
      siteId: String(site._id),
      siteName: site.name,
      createdAt,
      total: extractOrderTotal(raw),
      customerName: extractCustomerName(raw),
      customerPhone: extractCustomerPhone(raw),
      customerEmail:
        typeof raw.customerEmail === "string" ? raw.customerEmail : undefined,
      paymentStatus:
        typeof raw.paymentStatus === "string"
          ? raw.paymentStatus
          : typeof raw.orderStatus === "string"
            ? raw.orderStatus
            : undefined,
      raw,
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
