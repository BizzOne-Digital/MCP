import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
const env = readFileSync(envPath, "utf8");
const uri = env.match(/MONGODB_URI=(.+)/)?.[1]?.trim();
const dbName = env.match(/MCP_DB_NAME=(.+)/)?.[1]?.trim() || "master_control_panel";
const password = env.match(/MCP_PASSWORD=(.+)/)?.[1]?.trim() || "admin@123";
const email = process.argv[2] ?? "shumailausmanmalik2004@gmail.com";

await mongoose.connect(uri, { dbName });
const col = mongoose.connection.collection("mcp_admins");
const hash = await bcrypt.hash(password, 12);
await col.deleteMany({ email: "admin@mcp.local" });
await col.updateOne(
  { email },
  { $set: { email, passwordHash: hash } },
  { upsert: true }
);
console.log("Panel login:", email, "/", password);
await mongoose.disconnect();
