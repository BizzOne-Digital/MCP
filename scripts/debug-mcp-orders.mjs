import { readFileSync } from "fs";
import mongoose from "mongoose";

const env = readFileSync(".env.local", "utf8");
const uri = env.match(/MONGODB_URI=(.+)/)?.[1]?.trim();
const dbName = env.match(/MCP_DB_NAME=(.+)/)?.[1]?.trim() || "master_control_panel";
await mongoose.connect(uri, { dbName });
const sites = await mongoose.connection.collection("sites").find({}).toArray();
for (const s of sites.slice(0, 3)) {
  const db = mongoose.connection.useDb(s.databaseName);
  const n = await db.collection("orders").countDocuments({ paymentStatus: "paid" });
  console.log(s.name, "db:", s.databaseName, "paid:", n);
}
await mongoose.disconnect();
