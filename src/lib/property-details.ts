import type { Listing } from './listings';
export function englishLabel(value:string){
 const words=value.replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2').replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim();
 return words.split(/\s*,\s*/).map((part,i)=>{
  const sentence=part.toLowerCase().replace(/\b(hoa|hvac|ac|ev|rv|pvc)\b/g,word=>word.toUpperCase());
  return i===0?sentence.charAt(0).toUpperCase()+sentence.slice(1):sentence;
 }).join(', ');
}
export function detailGroups(listing:Listing){
 const groups=[{id:'interior',title:'Inside the home',items:[] as string[]},{id:'outdoor',title:'Outdoor living',items:[] as string[]},{id:'practical',title:'Parking and other details',items:[] as string[]}];
 for(const raw of listing.features.flatMap(f=>f.split(','))){const label=englishLabel(raw);if(!label)continue;const index=/pool|patio|courtyard|garden|waterfront|balcony|outdoor|dock/i.test(label)?1:/kitchen|sink|bed|bath|floor|layout|living|ceiling|closet/i.test(label)?0:2;if(!groups[index].items.includes(label))groups[index].items.push(label);}
 return groups;
}
