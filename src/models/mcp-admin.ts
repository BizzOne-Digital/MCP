import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const mcpAdminSchema = new Schema(
  {
    email: { type: String, default: "admin@mcp.local", unique: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export type McpAdmin = InferSchemaType<typeof mcpAdminSchema>;

export function getMcpAdminModel(): Model<McpAdmin> {
  return (
    mongoose.models.McpAdmin ??
    mongoose.model<McpAdmin>("McpAdmin", mcpAdminSchema, "mcp_admins")
  );
}
