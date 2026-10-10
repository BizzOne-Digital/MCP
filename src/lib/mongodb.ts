import mongoose from "mongoose";
import { env } from "@/lib/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cache;

export async function connectMongoose(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(env.mongodbUri(), {
      dbName: env.mcpDbName(),
      bufferCommands: false,
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}

export function siteDb(databaseName: string) {
  return mongoose.connection.useDb(databaseName, { useCache: true });
}
