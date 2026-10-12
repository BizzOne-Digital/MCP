import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const settingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    timezone: { type: String, default: "Asia/Karachi" },
    currency: { type: String, default: "USD" },
  },
  { timestamps: true }
);

export type McpSettings = InferSchemaType<typeof settingsSchema>;

export function getMcpSettingsModel(): Model<McpSettings> {
  return (
    mongoose.models.McpSettings ??
    mongoose.model<McpSettings>("McpSettings", settingsSchema, "mcp_settings")
  );
}

export async function getGlobalSettings(): Promise<McpSettings & { _id: mongoose.Types.ObjectId }> {
  const { connectMongoose } = await import("@/lib/mongodb");
  await connectMongoose();
  const Model = getMcpSettingsModel();
  let doc = await Model.findOne({ key: "global" });
  if (!doc) {
    doc = await Model.create({ key: "global" });
  }
  return doc;
}
