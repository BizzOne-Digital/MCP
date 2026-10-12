import { readFileSync } from "fs";
import mongoose from "mongoose";

const env = readFileSync(".env.local", "utf8");
const uri = env.match(/MONGODB_URI=(.+)/)?.[1]?.trim();
await mongoose.connect(uri, { dbName: "ono-poke-bar" });
const col = mongoose.connection.collection("orders");
const paid = await col.findOne({ paymentStatus: "paid" });
const any = await col.findOne({});
console.log("paid count", await col.countDocuments({ paymentStatus: "paid" }));
console.log("total count", await col.countDocuments({}));
if (paid) {
  console.log("paid keys", Object.keys(paid));
  console.log(JSON.stringify(paid, null, 2).slice(0, 1500));
} else if (any) {
  console.log("sample keys", Object.keys(any));
  console.log("status", any.paymentStatus, any.status, any.orderStatus);
}
await mongoose.disconnect();
