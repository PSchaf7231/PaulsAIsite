import 'server-only';
import { searchInventory,getListing } from './service';
import { sparkConfigured } from './spark';
export function listingsSource(){return sparkConfigured()?'live':'sample';}
export function listingsService(){return {search:async(filters:import('@/lib/listings').ListingFilters={})=>(await searchInventory(filters)).listings,getBySlug:getListing};}
