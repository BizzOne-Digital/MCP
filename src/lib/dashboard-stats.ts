import { connectMongoose } from "@/lib/mongodb";
import { fetchAllPaidOrders, type UnifiedOrder } from "@/lib/orders";
import { getSiteModel } from "@/models/site";

export type DashboardStats = {
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

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function weekStartKey(d: Date) {
  const x = new Date(d);
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return dayKey(x);
}

/** Daily for short ranges; weekly buckets for all-time so the chart stays inside the card. */
function buildSalesChart(
  orders: UnifiedOrder[],
  days: number
): { date: string; total: number }[] {
  const useWeekly = days <= 0 || days > 31;
  const buckets = new Map<string, number>();

  if (!useWeekly && days > 0) {
    const start = new Date();
    start.setDate(start.getDate() - days);
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i + 1);
      buckets.set(dayKey(d), 0);
    }
  }

  for (const o of orders) {
    const d = new Date(o.createdAt);
    const key = useWeekly ? weekStartKey(d) : dayKey(d);
    buckets.set(key, (buckets.get(key) ?? 0) + o.total);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ date, total }));
}

function filterByRange(orders: UnifiedOrder[], days: number): UnifiedOrder[] {
  if (days <= 0) return orders;
  const start = new Date();
  start.setDate(start.getDate() - days);
  return orders.filter((o) => new Date(o.createdAt) >= start);
}

function customerStats(orders: UnifiedOrder[]) {
  const seen = new Map<string, number>();
  for (const o of orders) {
    const key =
      o.customerPhone ??
      o.customerEmail ??
      o.customerName ??
      `order-${o.id}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  let newCustomers = 0;
  let returningCustomers = 0;
  for (const count of seen.values()) {
    if (count > 1) returningCustomers += 1;
    else newCustomers += 1;
  }
  return { newCustomers, returningCustomers };
}

export async function getDashboardStats(days = 7): Promise<DashboardStats> {
  await connectMongoose();
  const sites = await getSiteModel().find({ isActive: true }).lean();
  const allPaid = await fetchAllPaidOrders(sites);

  const inRange = filterByRange(allPaid, days);
  const prevRange = days > 0
    ? filterByRange(
        allPaid.filter((o) => {
          const d = new Date(o.createdAt);
          const end = new Date();
          end.setDate(end.getDate() - days);
          const start = new Date(end);
          start.setDate(start.getDate() - days);
          return d >= start && d < end;
        }),
        days
      )
    : [];

  const totalOrders = inRange.length;
  const orderChangePct =
    days <= 0 || prevRange.length === 0
      ? 0
      : ((totalOrders - prevRange.length) / prevRange.length) * 100;

  const sales = inRange.reduce((s, o) => s + o.total, 0);
  const averageOrderValue = totalOrders ? sales / totalOrders : 0;

  const { newCustomers: newClients, returningCustomers: returningClients } =
    customerStats(inRange);

  const salesByDay = buildSalesChart(inRange, days);

  const paidOrderRows = [...inRange]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .map((o) => ({
      id: o.id,
      siteName: o.siteName,
      orderNumber: o.orderNumber ?? o.id.slice(-8),
      customerName: o.customerName ?? "—",
      customerPhone: o.customerPhone ?? "—",
      customerEmail: o.customerEmail ?? "—",
      createdAt: o.createdAt,
      total: o.total,
    }));

  return {
    totalOrders,
    orderChangePct,
    averageOrderValue,
    totalSales: sales,
    newClients,
    returningClients,
    salesByDay,
    paidOrderRows,
  };
}
