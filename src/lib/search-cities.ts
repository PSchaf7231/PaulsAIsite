// Town names for search: the City dropdowns, typed-town detection (with common misspellings) and "Did you mean" suggestions.
// Pure helpers shared by client components and the server. City names match the MLS "city" values exactly.

// Shown in every City dropdown, alphabetical.
export const searchCities=[
 'Boca Raton','Boynton Beach','Delray Beach','Highland Beach','Juno Beach','Jupiter','Lake Worth','Lake Worth Beach',
 'North Palm Beach','Palm Beach','Palm Beach Gardens','Tequesta','Wellington','West Palm Beach'
];

// Other Palm Beach County places a visitor may type. Used for matching only; the server adds every city stored in the MLS table.
const otherTowns=[
 'Greenacres','Lantana','Royal Palm Beach','Riviera Beach','Singer Island','Palm Beach Shores','Lake Park','Hypoluxo','Manalapan',
 'Ocean Ridge','Gulf Stream','Briny Breezes','Jupiter Inlet Colony','Palm Springs','Lake Clarke Shores','Loxahatchee','Loxahatchee Groves',
 'Westlake','Belle Glade','Pahokee','South Bay','Palm Beach County'
];

// Spellings that fuzzy matching alone would not catch (short forms, split words).
const aliases:Record<string,string>={
 'boca':'Boca Raton','boca ratan':'Boca Raton','boca rotan':'Boca Raton',
 'delray':'Delray Beach','del ray':'Delray Beach','del rey':'Delray Beach','delrey':'Delray Beach','dellray':'Delray Beach','del ray beach':'Delray Beach','del rey beach':'Delray Beach','delrey beach':'Delray Beach','delray bch':'Delray Beach',
 'boynton':'Boynton Beach','boyton':'Boynton Beach','boyton beach':'Boynton Beach',
 'west palm':'West Palm Beach','wpb':'West Palm Beach','w palm beach':'West Palm Beach',
 'pbg':'Palm Beach Gardens','palm beach garden':'Palm Beach Gardens','pb gardens':'Palm Beach Gardens',
 'npb':'North Palm Beach','n palm beach':'North Palm Beach',
 'highland':'Highland Beach','juno':'Juno Beach','lake worth bch':'Lake Worth Beach','royal palm':'Royal Palm Beach'
};

// "Palm Beach County" is the whole area, never the town of Palm Beach.
const COUNTY=/\bpalm\s*beach\s+county\b|\bpbc\b/g;
const norm=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const squash=(s:string)=>norm(s).replace(/ /g,'');

// Damerau-Levenshtein (optimal string alignment) distance, capped for speed.
export function editDistance(a:string,b:string,max=3){
 if(Math.abs(a.length-b.length)>max)return max+1;
 const d:number[][]=Array.from({length:a.length+1},(_,i)=>[i,...Array(b.length).fill(0)]);
 for(let j=0;j<=b.length;j++)d[0][j]=j;
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
  const cost=a[i-1]===b[j-1]?0:1;
  d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+cost);
  if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
 }
 return d[a.length][b.length];
}
// How many typos a name of this length may carry and still count as that town.
const allowance=(len:number)=>len>=9?2:len>=5?1:0;

export type TownMatch={city:string;exact:boolean;typed:string};

function candidates(extra:string[]){
 const names=[...new Set([...searchCities,...otherTowns,...extra.filter(Boolean)])];
 return names.map(name=>({name,key:squash(name)}));
}

// Finds the town a typed phrase names, e.g. "pool home in del ray" -> Delray Beach, "Jupitor" -> Jupiter.
// Longer town names win ("West Palm Beach" over "Palm Beach"), exact spellings win over typos.
export function findTown(text:string,extra:string[]=[]):TownMatch|null{
 const cleaned=norm(text.toLowerCase().replace(COUNTY,' '));
 if(!cleaned)return null;
 const words=cleaned.split(' ');
 const list=candidates(extra);
 let best:{city:string;exact:boolean;typed:string;score:number}|null=null;
 for(let size=Math.min(4,words.length);size>=1;size--){
  for(let start=0;start+size<=words.length;start++){
   const gram=words.slice(start,start+size);
   if(gram.some(w=>/\d/.test(w)))continue;
   const phrase=gram.join(' '),key=gram.join('');
   if(key.length<3)continue;
   const alias=aliases[phrase];
   let hit:{city:string;exact:boolean}|null=null;
   const exact=list.find(c=>c.key===key);
   if(exact)hit={city:exact.name,exact:true};
   else if(alias)hit={city:alias,exact:true};
   else if(key.length>=5){
    let close:{name:string;dist:number}|null=null;
    for(const c of list){const allow=allowance(c.key.length);if(!allow)continue;const dist=editDistance(key,c.key,allow);if(dist<=allow&&(!close||dist<close.dist))close={name:c.name,dist};}
    if(close)hit={city:close.name,exact:false};
   }
   if(!hit||hit.city==='Palm Beach County')continue;
   // Prefer exact over typo, then the longer town name.
   const score=(hit.exact?1000:0)+squash(hit.city).length;
   if(!best||score>best.score)best={...hit,typed:phrase,score};
  }
 }
 return best?{city:best.city,exact:best.exact,typed:best.typed}:null;
}

// Closest towns to something that matched nothing, for "Did you mean …?".
export function suggestTowns(text:string,extra:string[]=[],limit=3){
 const key=squash(text.toLowerCase().replace(COUNTY,' '));
 if(key.length<3)return [];
 const scored=candidates(extra).filter(c=>c.name!=='Palm Beach County').map(c=>{
  const whole=editDistance(key,c.key,6);
  // Also compare against the start of the name, so "jupit" or "wellingt" still suggest the town.
  const prefix=editDistance(key,c.key.slice(0,key.length),6);
  return {name:c.name,dist:Math.min(whole,prefix+1)};
 });
 const limitDist=Math.min(3,Math.max(2,Math.floor(key.length/4)));
 return scored.filter(s=>s.dist<=limitDist).sort((a,b)=>a.dist-b.dist||a.name.localeCompare(b.name)).slice(0,limit).map(s=>s.name);
}
