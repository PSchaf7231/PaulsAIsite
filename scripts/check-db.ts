import "dotenv/config";

import { createPrismaClient } from "../src/server/prisma-client";
const db = createPrismaClient();
async function main() {
 const count = await db.listing.count();
 const samples = await db.listing.count({where:{isSample:true}});
 console.log(`Database connected: ${count} listings (${samples} samples).`);
}
main().catch(() => {console.error("Database check failed. Verify .env, Supabase project status, and migrations.");process.exitCode=1;}).finally(() => db.$disconnect());
