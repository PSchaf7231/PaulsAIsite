import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
// Used by server code and CLI scripts only. Never import into client components.
export function createPrismaClient() {
 // DIRECT_URL is also used successfully by `prisma migrate deploy` during the
 // Vercel build. Prefer that verified connection at runtime; keep the pooled
 // DATABASE_URL as a fallback for environments that only provide one URL.
 const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
 if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required for database mode.");
 return new PrismaClient({adapter:new PrismaPg({connectionString,max:5,connectionTimeoutMillis:10000})});
}
