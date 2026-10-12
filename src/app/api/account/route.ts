import { NextResponse } from "next/server";
import { z } from "zod";
import { connectMongoose } from "@/lib/mongodb";
import { getMcpAdminModel } from "@/models/mcp-admin";
import { getGlobalSettings } from "@/models/mcp-settings";

export async function GET() {
  await connectMongoose();
  const admin = await getMcpAdminModel().findOne().sort({ createdAt: 1 });
  const settings = await getGlobalSettings();
  return NextResponse.json({
    email: admin?.email ?? "admin@mcp.local",
    timezone: settings.timezone,
    currency: settings.currency,
  });
}

const patchSchema = z.object({
  timezone: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
});

export async function PATCH(request: Request) {
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await connectMongoose();
  await getGlobalSettings();
  const Model = (await import("@/models/mcp-settings")).getMcpSettingsModel();
  const settings = await Model.findOneAndUpdate(
    { key: "global" },
    {
      $set: {
        ...(body.timezone ? { timezone: body.timezone } : {}),
        ...(body.currency ? { currency: body.currency } : {}),
      },
    },
    { new: true }
  );

  return NextResponse.json({
    timezone: settings?.timezone ?? "Asia/Karachi",
    currency: settings?.currency ?? "USD",
  });
}
