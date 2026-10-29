import "dotenv/config";
import { ListingType } from "@prisma/client";
import samples from "../src/lib/sample-listings.json";
import { createPrismaClient } from "../src/server/prisma-client";
const db = createPrismaClient();
async function main() {
 await db.$transaction(async tx => {
  for (const item of samples) {
   const {photos, ...listing} = item;
   const existing = await tx.listing.findUnique({where:{slug:item.slug}});
   if (existing && !existing.isSample) throw new Error("Seed would overwrite a real listing; stopped.");
   const data = {...listing, type:listing.type as ListingType};
   await tx.listing.upsert({where:{slug:listing.slug},create:{...data,photos:{create:photos}},update:{...data,photos:{deleteMany:{},create:photos}}});
  }
 });
 console.log("Five sample listings seeded. Safe to run again; no duplicates.");
}
main().catch(() => {console.error("Seed failed. Check database access and migrations; no credentials are printed.");process.exitCode=1;}).finally(() => db.$disconnect());
