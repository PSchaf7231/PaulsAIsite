// Typed address / MLS-number / free-word search. Pure helpers shared by the SQL store and the sample inventory.
// "911 N Ocean" must mean house number 911 on a street with the words N(orth) and Ocean, never a home whose
// MLS number happens to contain 911, and never "911 Ocean Drive" (no N).

// Each spelling maps to one canonical word; matching accepts every spelling of that word.
const SYNONYMS:string[][]=[
 ['n','north'],['s','south'],['e','east'],['w','west'],['ne','northeast'],['nw','northwest'],['se','southeast'],['sw','southwest'],
 ['blvd','boulevard','blv'],['ave','avenue','av'],['st','street'],['dr','drive'],['rd','road'],['ct','court'],['ln','lane'],
 ['pl','place'],['ter','terrace','terr'],['cir','circle'],['pkwy','parkway'],['hwy','highway'],['trl','trail'],['sq','square'],
 ['pt','point'],['cv','cove'],['ctr','center'],['crk','creek'],['xing','crossing'],['isle','island'],['mt','mount'],['hts','heights'],['tpke','turnpike']
];
const CANON=new Map<string,string>();for(const group of SYNONYMS)for(const word of group)CANON.set(word,group[0]);
const ALTERNATIVES=new Map<string,string[]>(SYNONYMS.map(g=>[g[0],g]));
const UNIT_WORDS=new Set(['unit','apt','apartment','ste','suite']);
const PLACE_WORDS=new Set(['fl','florida','usa','us']);
export const canonicalWord=(word:string)=>CANON.get(word)??word;
export const wordAlternatives=(canonical:string)=>ALTERNATIVES.get(canonical)??[canonical];
const words=(text:string)=>text.toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(Boolean);

export type TextQuery=
 |{kind:'mls';key:string;digits:string}
 |{kind:'address';number:string;street:string[];locality:string[]}
 |{kind:'words';tokens:string[]};

// MLS numbers only when the whole phrase has MLS shape: one or two letters + 6+ digits (RX-11012345, A11934670) or 7-10 digits.
const MLS_SHAPE=/^\s*(?:[a-z]{1,2}-?\d{6,}|\d{7,10})\s*$/i;
// Address: a leading house number (optionally with one letter, e.g. 12A) followed by at least one word.
const ADDRESS_SHAPE=/^\s*(\d{1,6}[a-z]?)\s+(.*\S)\s*$/i;
export const looksLikeMls=(text:string)=>MLS_SHAPE.test(text);
export const looksLikeAddress=(text:string)=>{const m=text.match(ADDRESS_SHAPE);return !!m&&/[a-z]/i.test(m[2].split(',')[0])&&!/^\s*\d{5}\s*$/.test(text);};

export function parseTextQuery(text:string):TextQuery{
 const trimmed=text.trim();
 if(looksLikeMls(trimmed)){const key=trimmed.toLowerCase().replace(/[^a-z0-9]/g,'');return {kind:'mls',key,digits:key.replace(/^[a-z]+/,'')};}
 const m=looksLikeAddress(trimmed)?trimmed.match(ADDRESS_SHAPE):null;
 if(m){
  const [streetPart,...rest]=m[2].split(',');
  const tail=words(rest.join(' ')).filter(w=>!PLACE_WORDS.has(w));
  const street:string[]=[],locality:string[]=[...tail];
  const streetWords=words(streetPart);
  // A trailing state/ZIP typed without a comma ("... Blvd FL 33480") is locality, not street.
  while(streetWords.length>1&&(PLACE_WORDS.has(streetWords.at(-1)!)||/^\d{5}$/.test(streetWords.at(-1)!))){const w=streetWords.pop()!;if(!PLACE_WORDS.has(w))locality.unshift(w);}
  for(const w of streetWords)if(!UNIT_WORDS.has(w))street.push(canonicalWord(w));
  if(street.length)return {kind:'address',number:m[1].toLowerCase(),street:street.slice(0,8),locality:locality.slice(0,6)};
 }
 return {kind:'words',tokens:words(trimmed).filter(w=>!PLACE_WORDS.has(w)&&!UNIT_WORDS.has(w)).slice(0,8)};
}

// Word boundaries written so the same pattern works in JavaScript and PostgreSQL (~ operator).
const B='(^|[^a-z0-9])',E='([^a-z0-9]|$)';
const escape=(w:string)=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const anyOf=(alts:string[])=>alts.length===1?escape(alts[0]):`(${alts.map(escape).join('|')})`;
export const wholeWordPattern=(word:string)=>`${B}${anyOf(wordAlternatives(word))}${E}`;
export const houseNumberPattern=(number:string)=>`^[^a-z0-9]*${escape(number)}${E}`;
// Exact street: the address starts with the number followed directly by the typed words in order.
export const exactStreetPattern=(q:{number:string;street:string[]})=>`^[^a-z0-9]*${[escape(q.number),...q.street.map(w=>anyOf(wordAlternatives(w)))].join('[^a-z0-9]+')}${E}`;
// Short or numeric free words must be whole words; longer words may be a prefix/substring (e.g. "ocean" in "Oceanfront").
export const wholeWordOnly=(token:string)=>token.length<=2||/^\d+$/.test(token);

type Searchable={address:string;city:string;postalCode:string;mlsNumber?:string};
export function textQueryMatches(listing:Searchable,q:TextQuery){
 const address=listing.address.toLowerCase();
 if(q.kind==='mls'){const key=(listing.mlsNumber||'').toLowerCase().replace(/[^a-z0-9]/g,'');return key===q.key||(/^\d+$/.test(q.key)&&key.replace(/^[a-z]+/,'')===q.digits);}
 if(q.kind==='address'){
  const place=`${listing.city} ${listing.postalCode}`.toLowerCase();
  return new RegExp(houseNumberPattern(q.number)).test(address)&&q.street.every(w=>new RegExp(wholeWordPattern(w)).test(address))&&q.locality.every(w=>place.includes(w));
 }
 const hay=[listing.address,listing.city,listing.postalCode,listing.mlsNumber||''].join(' ').toLowerCase();
 return q.tokens.every(t=>wholeWordOnly(t)?new RegExp(`${B}${escape(t)}${E}`).test(hay):hay.includes(t));
}
export function exactStreetMatch(address:string,q:TextQuery){return q.kind==='address'&&new RegExp(exactStreetPattern(q)).test(address.toLowerCase());}
