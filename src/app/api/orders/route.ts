import { NextResponse } from "next/server";
import { connectMongoose } from "@/lib/mongodb";
import { getSiteModel } from "@/models/site";
import { fetchAllPaidOrders } from "@/lib/orders";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sinceParam = searchParams.get("since");
  const siteIdParam = searchParams.get("siteId");
  const since = sinceParam ? new Date(sinceParam) : undefined;
  if (sinceParam && since && Number.isNaN(since.getTime())) {
    return NextResponse.json({ error: "Invalid since parameter" }, { status: 400 });
  }

  try {
    await connectMongoose();
    let sites;
    if (siteIdParam) {
      const site = await getSiteModel().findById(siteIdParam).lean();
      if (!site) {
        return NextResponse.json({ error: "Site not found", orders: [] }, { status: 404 });
      }
      sites = [site];
    } else {
      sites = await getSiteModel().find({ isActive: true }).lean();
    }
    const orders = await fetchAllPaidOrders(sites, since);

    return NextResponse.json({ orders, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error("GET /api/orders failed:", err);
    const message = err instanceof Error ? err.message : "Failed to load orders";
    return NextResponse.json({ error: message, orders: [] }, { status: 500 });
  }
}
