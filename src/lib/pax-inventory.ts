import type { PaxState } from './pax';
import type { Listing } from './listings';
import samples from './sample-listings.json';
export function sessionListings(state:PaxState):Listing[]{return state.listingRecords|| (state.feedMode==='live'||state.feedMode==='unavailable'?[]:samples as Listing[]);}
export function rememberListings(state:PaxState,listings:Listing[]){const records=new Map(sessionListings(state).map(l=>[l.slug,l]));for(const l of listings)records.set(l.slug,{...l,photos:l.photos.slice(0,1)});state.listingRecords=[...records.values()];}

export function setFeedMode(state:PaxState,mode:'live'|'sample'|'unavailable'){
 if(state.feedMode!==mode){state.results=[];state.listingRecords=[];state.matchNotes={};state.hasMoreResults=false;}
 state.feedMode=mode;
}
