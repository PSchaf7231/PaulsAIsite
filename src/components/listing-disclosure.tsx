import type { Listing } from '@/lib/listings';
import { IDX_DISCLAIMER } from '@/lib/idx';
export default function ListingDisclosure({listing,live=false,checkedAt,compact=false}:{listing?:Listing;live?:boolean;checkedAt?:string;compact?:boolean}){
 if(listing?.isSample||(!listing&&!live))return null;
 const updated=listing?.updatedAt||checkedAt;
 return <div className="listing-disclosure">{listing?.office&&<p>Listing courtesy of {listing.office}</p>}{updated&&<p>Last updated: <time dateTime={updated}>{new Date(updated).toLocaleString('en-US',{timeZone:'America/New_York',timeZoneName:'short'})}</time></p>}{!compact&&<><p>{IDX_DISCLAIMER}</p><p>© {new Date().getFullYear()} BeachesMLS. All rights reserved.</p></>}</div>;
}
