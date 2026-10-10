import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { env } from "@/lib/env";
import { connectMongoose } from "@/lib/mongodb";
import { getMcpAdminModel } from "@/models/mcp-admin";

const bodySchema = z.object({ password: z.string().min(1) });

async function passwordMatches(password: string): Promise<boolean> {
  await connectMongoose();
  const admin = await getMcpAdminModel().findOne({ email: "admin@mcp.local" });
  if (admin?.passwordHash) {
    return bcrypt.compare(password, admin.passwordHash);
  }
  try {
    return password === env.mcpPassword();
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!(await passwordMatches(body.password))) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = await createSessionToken();
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
