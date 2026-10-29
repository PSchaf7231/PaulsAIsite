export type ListingType = "SALE" | "RENT" | "COMMERCIAL";
export type Listing = {
 propertyType?:string; verifiedAmenities?:Record<string,boolean>;
 id: string; slug: string; title: string; address: string; city: string; postalCode: string;
 price: number; beds: number; baths: number; sqft: number; latitude: number; longitude: number;
 type: ListingType; status: string; description: string; features: string[]; source: string;
 attribution: string | null; isSample: boolean; photos: { url: string; alt: string; position: number }[];
};
export type ListingFilters = { city?: string; type?: ListingType; minPrice?: number; maxPrice?: number; beds?: number; sort?: "price-asc" | "price-desc" };
export function filterListings(listings: Listing[], filters: ListingFilters = {}) {
 const result = listings.filter(l => l.status === "ACTIVE" && (!filters.city || l.city === filters.city) && (!filters.type || l.type === filters.type) && (filters.minPrice == null || l.price >= filters.minPrice) && (filters.maxPrice == null || l.price <= filters.maxPrice) && (filters.beds == null || l.beds >= filters.beds));
 if (filters.sort) result.sort((a,b) => filters.sort === "price-desc" ? b.price-a.price : a.price-b.price);
 return result;
}
export const money = (value: number) => new Intl.NumberFormat("en-US", {style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);
export const listingPrice = (listing: Listing) => money(listing.price) + (listing.type === "RENT" ? " / month" : "");
