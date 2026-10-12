import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/dashboard-stats";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get("days");
  const days = daysParam === null ? 0 : Number(daysParam);
  try {
    const stats = await getDashboardStats(Number.isFinite(days) ? days : 0);
    return NextResponse.json(stats);
  } catch (err) {
    console.error("Dashboard stats failed:", err);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}
