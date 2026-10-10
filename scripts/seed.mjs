import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");

function loadEnv() {
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const uri = process.env.MONGODB_URI;
const dbName = process.env.MCP_DB_NAME ?? "master_control_panel";
const password = process.argv[2] ?? process.env.MCP_PASSWORD ?? "admin@123";

if (!uri) {
  console.error("MONGODB_URI missing in .env.local");
  process.exit(1);
}

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, default: "admin@mcp.local", unique: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

async function main() {
  await mongoose.connect(uri, { dbName });
  const McpAdmin = mongoose.models.SeedMcpAdmin ?? mongoose.model("SeedMcpAdmin", adminSchema, "mcp_admins");

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await McpAdmin.findOneAndUpdate(
    { email: "admin@mcp.local" },
    { email: "admin@mcp.local", passwordHash },
    { upsert: true, new: true }
  );

  console.log("MCP admin ready:", admin.email);
  console.log("Login with panel password:", password);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
