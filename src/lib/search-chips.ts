import type { Preference } from './pax';
export type SearchChip={field:keyof Preference;value?:string;label:string};
const money=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
export function searchChips(p:Preference):SearchChip[]{
 const chips:SearchChip[]=[];
 for(const area of p.areas|| (p.area?[p.area]:[]))chips.push({field:p.areas?'areas':'area',value:area,label:area});
 if(p.minPrice!=null||p.maxPrice!=null)chips.push({field:'maxPrice',label:p.minPrice!=null&&p.maxPrice!=null?`${money(p.minPrice)}–${money(p.maxPrice)}`:p.maxPrice!=null?`Up to ${money(p.maxPrice)}`:`From ${money(p.minPrice!)}`});
 if(p.beds!=null)chips.push({field:'beds',label:`${p.beds}+ beds`});if(p.baths!=null)chips.push({field:'baths',label:`${p.baths}+ baths`});
 if(p.type)chips.push({field:'type',label:{SALE:'For sale',RENT:'For rent',COMMERCIAL:'Commercial'}[p.type]});
 if(p.propertyType)chips.push({field:'propertyType',label:p.propertyType.toLowerCase()});
 for(const field of ['mustHaves','dealBreakers'] as const)for(const term of p[field]||[])chips.push({field,value:term,label:field==='dealBreakers'?`No ${term}`:term});
 return chips;
}
