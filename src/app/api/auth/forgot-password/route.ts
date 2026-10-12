import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectMongoose } from "@/lib/mongodb";
import { getMcpAdminModel } from "@/models/mcp-admin";
import { getPasswordOtpModel } from "@/models/password-otp";
import { sendOtpEmail } from "@/lib/mail";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  const email = body.email.toLowerCase().trim();
  await connectMongoose();
  const admin = await getMcpAdminModel().findOne({ email });
  if (!admin) {
    return NextResponse.json(
      { error: "No account found with this email" },
      { status: 404 }
    );
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await getPasswordOtpModel().deleteMany({ email });
  await getPasswordOtpModel().create({ email, otpHash, expiresAt });

  try {
    await sendOtpEmail(email, otp);
  } catch (err) {
    console.error("SMTP send failed:", err);
    return NextResponse.json(
      { error: "Could not send email. Check SMTP settings." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
