import mongoose from "mongoose";
import { connectMongoose } from "@/lib/mongodb";

export type StoredAdminCreds = {
  email?: string;
  password?: string;
};

export async function getStoredAdminCreds(
  siteId: string
): Promise<StoredAdminCreds> {
  await connectMongoose();
  const doc = await mongoose.connection.collection("sites").findOne(
    { _id: new mongoose.Types.ObjectId(siteId) },
    { projection: { storedAdminEmail: 1, storedAdminPassword: 1 } }
  );

  return {
    email:
      typeof doc?.storedAdminEmail === "string" ? doc.storedAdminEmail : undefined,
    password:
      typeof doc?.storedAdminPassword === "string"
        ? doc.storedAdminPassword
        : undefined,
  };
}

export async function setStoredAdminCreds(
  siteId: string,
  email: string,
  password: string
): Promise<void> {
  await connectMongoose();
  await mongoose.connection.collection("sites").updateOne(
    { _id: new mongoose.Types.ObjectId(siteId) },
    {
      $set: {
        storedAdminEmail: email,
        storedAdminPassword: password,
      },
    }
  );
}
