import mongoose from "mongoose";
import { connectMongoose } from "@/lib/mongodb";
import { env } from "@/lib/env";

const HIDDEN = new Set(["admin", "local"]);

export async function listClusterDatabases(): Promise<string[]> {
  await connectMongoose();
  const db = mongoose.connection.db;
  if (!db) return [];

  const { databases } = await db.admin().listDatabases();
  const mcpDb = env.mcpDbName();

  return databases
    .map((d) => d.name)
    .filter((name) => !HIDDEN.has(name) && name !== mcpDb)
    .sort((a, b) => a.localeCompare(b));
}
