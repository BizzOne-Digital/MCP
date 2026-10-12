import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const siteSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    databaseName: { type: String, required: true, trim: true },
    ordersCollection: { type: String, default: "orders" },
    orderDateField: { type: String, default: "createdAt" },
    paidStatusField: { type: String, default: "paymentStatus" },
    paidStatusValue: { type: String, default: "paid" },
    paidFilterJson: { type: String },
    adminCollection: { type: String, default: "users" },
    adminEmailField: { type: String, default: "email" },
    adminPasswordField: { type: String, default: "passwordHash" },
    adminRoleField: { type: String, default: "role" },
    adminRoleValue: { type: String, default: "admin" },
    adminUserId: { type: String },
    adminLegacyEmail: { type: String },
    storedAdminEmail: { type: String },
    storedAdminPassword: { type: String },
    fullName: { type: String },
    contactPhone: { type: String },
    country: { type: String, default: "United States" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type SiteConfig = InferSchemaType<typeof siteSchema> & {
  _id: mongoose.Types.ObjectId;
};

export function getSiteModel(): Model<SiteConfig> {
  return (
    mongoose.models.Site ??
    mongoose.model<SiteConfig>("Site", siteSchema, "sites")
  );
}
