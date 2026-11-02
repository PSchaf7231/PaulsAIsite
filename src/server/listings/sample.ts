import samples from "../../lib/sample-listings.json";
import { filterListings,type Listing,type ListingFilters } from "../../lib/listings";
export const sampleListings=samples as Listing[];
export function searchSampleListings(filters:ListingFilters={}){return filterListings(sampleListings,filters);}
export function getSampleListing(slug:string){return filterListings(sampleListings).find(l=>l.slug===slug)??null;}
export const sampleProvider={
 async search(filters?:ListingFilters){return searchSampleListings(filters);},
 async getBySlug(slug:string){return getSampleListing(slug);}
};
