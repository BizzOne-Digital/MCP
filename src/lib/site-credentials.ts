import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { siteDb } from "@/lib/mongodb";
import type { SiteConfig } from "@/models/site";

const BCRYPT_ROUNDS = 12;

export function adminFilter(
  site: SiteConfig,
  emailField: string,
  email: string
): Record<string, unknown> {
  if (site.adminUserId) {
    return { _id: new mongoose.Types.ObjectId(site.adminUserId) };
  }
  if (site.adminRoleField) {
    return { [site.adminRoleField]: site.adminRoleValue ?? "admin" };
  }
  return { [emailField]: site.adminLegacyEmail ?? email };
}

export async function updateSiteAdminCredentials(
  site: SiteConfig,
  email: string,
  password: string
): Promise<void> {
  const db = siteDb(site.databaseName);
  const collection = db.collection(site.adminCollection);

  const emailField = site.adminEmailField ?? "email";
  const primaryPasswordField = site.adminPasswordField ?? "passwordHash";
  const filter = adminFilter(site, emailField, email);

  const existing = await collection.findOne(filter);
  if (!existing) {
    throw new Error(
      "Admin user not found. Check site database name and admin settings."
    );
  }

  const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const $set: Record<string, unknown> = {
    [emailField]: email,
    [primaryPasswordField]: hashed,
  };

  // Food-store sites use passwordHash for login; some older docs also have password.
  if (primaryPasswordField !== "passwordHash" && "passwordHash" in existing) {
    $set.passwordHash = hashed;
  }
  if (primaryPasswordField !== "password" && "password" in existing) {
    $set.password = hashed;
  }

  const result = await collection.updateOne(filter, { $set });
  if (result.matchedCount === 0) {
    throw new Error("Admin user not found.");
  }
}

export async function getSiteAdminEmailFromDb(
  site: SiteConfig
): Promise<string | null> {
  const db = siteDb(site.databaseName);
  const collection = db.collection(site.adminCollection ?? "users");
  const emailField = site.adminEmailField ?? "email";
  const filter = adminFilter(site, emailField, "");
  const doc = await collection.findOne(filter, {
    projection: { [emailField]: 1 },
  });
  const email = doc?.[emailField];
  return typeof email === "string" ? email : null;
}
