import { describe,it,expect } from 'vitest';
import { newState,propose,confirmAction } from '../src/server/pax/state';
import { showMatches,saveConfirmedSearch,matchCriteria } from '../src/server/pax/search-criteria';
import { removeCriterion,moreResults,resultDetails,compareHome } from '../src/server/pax/result-actions';
import { searchChips } from '../src/lib/search-chips';
import { sampleListings } from '../src/server/listings/sample';
import { finishTurn } from '../src/server/pax/turn';
import { testReply } from '../src/server/pax/test-reply';
describe('Pax search controls',()=>{
 it('clears the alert-request intent after confirming or declining its card',()=>{
  for(const accepted of [true,false]){const s=newState('a');s.alertRequested=true;s.lead={id:'lead',email:'buyer@example.com',capturedAt:'now'};const card=propose(s,{kind:'SEARCH',contact:s.lead});if(!('id' in card))throw new Error('Expected confirmation card');confirmAction(s,card.id,accepted);expect(s.alertRequested).toBe(false);}
 });
 it('removes only the selected chip and requires reconfirmation before changing alerts',()=>{
  const s=newState('a');s.preferences={areas:['Boca Raton','Boynton Beach'],minPrice:400000,maxPrice:1500000,beds:3,mustHaves:['pool','garage']};saveConfirmedSearch(s,s.preferences,'search');
  removeCriterion(s,'areas','Boca Raton');expect(s.preferences.areas).toEqual(['Boynton Beach']);expect(s.preferences.beds).toBe(3);expect(s.searches[0].preferences.areas).toHaveLength(2);
  removeCriterion(s,'mustHaves','garage');expect(s.preferences.mustHaves).toEqual(['pool']);removeCriterion(s,'maxPrice');expect(s.preferences.minPrice).toBeUndefined();expect(s.preferences.maxPrice).toBeUndefined();expect(s.searches[0].preferences.maxPrice).toBe(1500000);
  expect(searchChips(s.preferences).map(c=>c.label)).toEqual(['Boynton Beach','3+ beds','pool']);
 });
 it('pages six at a time without duplicates or changing previous result numbers',()=>{
  const s=newState('a');const inventory=Array.from({length:14},(_,i)=>({...sampleListings[0],id:`test-${i}`,slug:`test-${i}`,price:500000+i}));
  showMatches(s,inventory);expect(s.results).toHaveLength(6);expect(s.hasMoreResults).toBe(true);const initial=[...s.results];
  expect(moreResults(s,inventory).added).toBe(6);expect(s.results.slice(0,6)).toEqual(initial);expect(moreResults(s,inventory).added).toBe(2);expect(s.hasMoreResults).toBe(false);expect(moreResults(s,inventory).added).toBe(0);expect(new Set(s.results).size).toBe(14);
 });
 it('resolves visible numbers only, preserves order and limits comparisons to three',()=>{
  const s=newState('a');showMatches(s);const order=[...s.results];expect(resultDetails(s,3).listing?.slug).toBe(order[2]);expect(resultDetails(s,6)).toHaveProperty('error');expect(s.results).toEqual(order);
  for(const l of sampleListings.slice(0,3))compareHome(s,l.slug);expect(compareHome(s,sampleListings[3].slug)).toHaveProperty('error');expect(compareHome(s,'fake')).toHaveProperty('error');compareHome(s,sampleListings[0].slug,true);expect(compareHome(s,sampleListings[0].slug).compared).toHaveLength(3);
 });
 it('does not imply a shared or unspecified pool is private',()=>{
  const l={...sampleListings[0],features:['Community pool']};expect(matchCriteria({mustHaves:['private pool']},[l])[0].exact).toBe(false);
 });
 it('answers a greeting warmly and asks one must-have question before a broad search',async()=>{
  const s=newState('a');s.messages.push({id:'1',role:'user',text:'hello',at:'now'});expect(await testReply(s,()=>{})).toContain('Glad you stopped by');expect(s.results).toHaveLength(0);finishTurn(s,'1','Hi!');expect(s.results).toHaveLength(0);
  s.messages.push({id:'2',role:'user',text:'Find a home',at:'now'});expect(await testReply(s,()=>{})).toContain('one must-have');expect(s.results).toHaveLength(0);
  s.messages.push({id:'3',role:'user',text:'just show me homes',at:'now'});await testReply(s,()=>{});expect(s.results).toHaveLength(3);
 });
});
