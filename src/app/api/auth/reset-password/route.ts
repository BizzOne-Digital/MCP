import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectMongoose } from "@/lib/mongodb";
import { getMcpAdminModel } from "@/models/mcp-admin";
import { getPasswordOtpModel } from "@/models/password-otp";

const bodySchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = body.email.toLowerCase().trim();
  await connectMongoose();

  const record = await getPasswordOtpModel().findOne({ email }).sort({ createdAt: -1 });
  if (!record || record.expiresAt < new Date()) {
    return NextResponse.json({ error: "OTP expired or invalid" }, { status: 400 });
  }

  const validOtp = await bcrypt.compare(body.otp, record.otpHash);
  if (!validOtp) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(body.password, 12);
  const admin = await getMcpAdminModel().findOneAndUpdate(
    { email },
    { passwordHash },
    { new: true }
  );
  if (!admin) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  await getPasswordOtpModel().deleteMany({ email });
  return NextResponse.json({ ok: true });
}
