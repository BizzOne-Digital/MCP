import { NextResponse } from "next/server";
import { z } from "zod";
import { connectMongoose } from "@/lib/mongodb";
import { getSiteModel } from "@/models/site";
import {
  getSiteAdminEmailFromDb,
  updateSiteAdminCredentials,
} from "@/lib/site-credentials";
import {
  getStoredAdminCreds,
  setStoredAdminCreds,
} from "@/lib/site-stored-creds";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  await connectMongoose();
  const site = await getSiteModel().findById(id);
  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const stored = await getStoredAdminCreds(id);

  let liveEmail: string | null = null;
  try {
    liveEmail = await getSiteAdminEmailFromDb(site);
  } catch (err) {
    console.error("Failed to read admin email from site DB:", err);
  }

  return NextResponse.json({
    currentEmail: stored.email ?? liveEmail ?? null,
    currentPassword: stored.password ?? null,
  });
}

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  await connectMongoose();
  const site = await getSiteModel().findById(id);
  if (!site) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  try {
    await updateSiteAdminCredentials(site, body.email, body.password);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await setStoredAdminCreds(id, body.email, body.password);

  return NextResponse.json({
    ok: true,
    currentEmail: body.email,
    currentPassword: body.password,
  });
}
