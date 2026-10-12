import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const otpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

otpSchema.index({ email: 1 });

export type PasswordOtp = InferSchemaType<typeof otpSchema>;

export function getPasswordOtpModel(): Model<PasswordOtp> {
  return (
    mongoose.models.PasswordOtp ??
    mongoose.model<PasswordOtp>("PasswordOtp", otpSchema, "password_otps")
  );
}
