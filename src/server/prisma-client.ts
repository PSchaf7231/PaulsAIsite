import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
// Used by server code and CLI scripts only. Never import into client components.
export function createPrismaClient() {
 const connectionString = process.env.DATABASE_URL;
 if (!connectionString) throw new Error("DATABASE_URL is required for database mode.");
 return new PrismaClient({adapter:new PrismaPg({connectionString,max:5,connectionTimeoutMillis:10000})});
}
