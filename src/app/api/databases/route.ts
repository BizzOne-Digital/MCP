import { NextResponse } from "next/server";
import { listClusterDatabases } from "@/lib/list-databases";

export async function GET() {
  try {
    const databases = await listClusterDatabases();
    return NextResponse.json({ databases });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list databases";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
