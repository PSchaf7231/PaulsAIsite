import "server-only";
import { getDb } from "../db";
import { sampleProvider } from "./sample";
import { type Listing, type ListingFilters } from "@/lib/listings";
export interface ListingsProvider {
 search(filters?: ListingFilters): Promise<Listing[]>;
 getBySlug(slug: string): Promise<Listing | null>;
}
const databaseProvider: ListingsProvider = {
 async search(filters = {}) {
  return getDb().listing.findMany({where:{status:"ACTIVE", city:filters.city || undefined, type:filters.type, price:{gte:filters.minPrice,lte:filters.maxPrice}, beds:{gte:filters.beds}},include:{photos:{orderBy:{position:"asc"}}},orderBy: filters.sort ? {price: filters.sort === "price-desc" ? "desc":"asc"} : {createdAt:"desc"}});
 },
 async getBySlug(slug) { return getDb().listing.findFirst({where:{slug,status:"ACTIVE"},include:{photos:{orderBy:{position:"asc"}}}}); }
};
export function listingsSource() {
 const source = process.env.LISTINGS_SOURCE;
 if (source !== "sample" && source !== "database") throw new Error("Set LISTINGS_SOURCE to sample or database in .env.");
 return source;
}
export function listingsService(): ListingsProvider { return listingsSource() === "sample" ? sampleProvider : databaseProvider; }
