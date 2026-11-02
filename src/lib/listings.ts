export type ListingType = "SALE" | "RENT" | "COMMERCIAL";
export type Listing = {
 listedAt?:string;mlsNumber?:string;office?:string;updatedAt?:string;checkedAt?:string;missingFields?:string[];
 propertyType?:string; verifiedAmenities?:Record<string,boolean>;
 id: string; slug: string; title: string; address: string; city: string; postalCode: string;
 price: number; beds: number; baths: number; sqft: number; latitude: number|null; longitude: number|null;
 type: ListingType; status: string; description: string; features: string[]; source: string;
 attribution: string | null; isSample: boolean; photos: { url: string; alt: string; position: number }[];
};
export type ListingFilters = { city?: string; areas?:string[];mustHaves?:string[];propertyType?:string;baths?:number; type?: ListingType; minPrice?: number; maxPrice?: number; beds?: number; sort?: "price-asc" | "price-desc" };
export function eligibleListing(listing:Listing){return listing.type!=="COMMERCIAL"&&(listing.type!=="RENT"||listing.price>=3500);}
export function filterListings(listings: Listing[], filters: ListingFilters = {}) {
 const result = listings.filter(l => eligibleListing(l) && l.status === "ACTIVE" && (!filters.propertyType || l.propertyType === filters.propertyType) && (!filters.city || l.city === filters.city)&&(!filters.areas?.length||filters.areas.includes(l.city)) && (!filters.type || l.type === filters.type) && (filters.minPrice == null || l.price >= filters.minPrice) && (filters.maxPrice == null || l.price <= filters.maxPrice) && (filters.beds == null || (!l.missingFields?.includes("beds")&&l.beds >= filters.beds))&&(filters.baths==null||(!l.missingFields?.includes("baths")&&l.baths>=filters.baths)));
 if (filters.sort) result.sort((a,b) => filters.sort === "price-desc" ? b.price-a.price : a.price-b.price);
 return result;
}
export const money = (value: number) => new Intl.NumberFormat("en-US", {style:"currency",currency:"USD",maximumFractionDigits:0}).format(value);
export const listingPrice = (listing: Listing) => money(listing.price) + (listing.type === "RENT" ? " / month" : "");

export function listingFact(listing:Listing,field:'beds'|'baths'|'sqft'){return listing.missingFields?.includes(field)?'—':listing[field].toLocaleString('en-US');}
