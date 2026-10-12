import { NextResponse } from "next/server";
import { z } from "zod";
import { connectMongoose } from "@/lib/mongodb";
import { slugFromName } from "@/lib/slug";
import { getSiteModel } from "@/models/site";
import { updateSiteAdminCredentials } from "@/lib/site-credentials";
import { setStoredAdminCreds } from "@/lib/site-stored-creds";

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  databaseName: z.string().min(1).optional(),
  fullName: z.string().optional(),
  contactPhone: z.string().optional(),
  country: z.string().optional(),
  adminEmail: z.string().email().optional(),
  adminPassword: z.string().min(6).optional(),
  ordersCollection: z.string().optional(),
  paidStatusField: z.string().optional(),
  paidStatusValue: z.string().optional(),
  adminCollection: z.string().optional(),
  adminEmailField: z.string().optional(),
  adminPasswordField: z.string().optional(),
  adminRoleField: z.string().optional(),
  adminRoleValue: z.string().optional(),
});

export async function GET() {
  try {
    await connectMongoose();
    const sites = await getSiteModel().find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ sites });
  } catch (err) {
    console.error("GET /api/sites failed:", err);
    return NextResponse.json({ error: "Failed to load sites", sites: [] }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid site data" }, { status: 400 });
  }

  const slug = body.slug ?? slugFromName(body.name);
  if (!slug) {
    return NextResponse.json({ error: "Could not generate slug from name" }, { status: 400 });
  }

  const databaseName = body.databaseName?.trim() || slug;

  try {
    await connectMongoose();
    const { adminEmail, adminPassword, ...siteFields } = body;
    const site = await getSiteModel().create({
      ...siteFields,
      slug,
      databaseName,
    });

    if (adminEmail && adminPassword) {
      try {
        await updateSiteAdminCredentials(site, adminEmail, adminPassword);
        await setStoredAdminCreds(String(site._id), adminEmail, adminPassword);
      } catch (credErr) {
        console.error("Admin creds on create failed:", credErr);
      }
    }

    return NextResponse.json({ site }, { status: 201 });
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code === 11000) {
      return NextResponse.json(
        { error: "A site with this name already exists." },
        { status: 409 }
      );
    }
    console.error("POST /api/sites failed:", err);
    return NextResponse.json({ error: "Failed to add site" }, { status: 500 });
  }
}
