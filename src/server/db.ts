import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const processCache = globalThis as typeof globalThis & { newEventDb?: PrismaClient };

export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  return processCache.newEventDb ??= new PrismaClient({adapter: new PrismaPg({connectionString, max: 4})});
}
