import { describe,it,expect } from 'vitest';
import { englishLabel,detailGroups } from '../src/lib/property-details';
import { homeSummary } from '../src/server/pax/home-summary';
import { sampleListings } from '../src/server/listings/sample';
import { requestPageAction } from '../src/server/pax/page-actions';
import { newState } from '../src/server/pax/state';
import { prepareTurn } from '../src/server/pax/turn';
import { randomUUID } from 'node:crypto';
describe('Listing detail experience',()=>{
 it('turns MLS labels into readable, grouped details without changing facts',()=>{
  expect(englishLabel('DualSinks, KitchenIsland')).toBe('Dual sinks, kitchen island');expect(englishLabel('HVACSystem')).toBe('HVAC system');expect(englishLabel('No_HOA')).toBe('No HOA');
  const groups=detailGroups({...sampleListings[0],features:['DualSinks, KitchenIsland','PrivatePool','TwoCarGarage']});expect(groups[0].items).toEqual(['Dual sinks','Kitchen island']);expect(groups[1].items).toEqual(['Private pool']);expect(groups[2].items).toEqual(['Two car garage']);
 });
 it('summarizes actual sample facts and identifies budget mismatches and unknown HOA',()=>{
  const l=sampleListings.find(l=>l.slug==='boynton-poolside')!;
  expect(homeSummary(l)).toHaveLength(4);expect(homeSummary(l)[0]).toContain('fictional sample');expect(homeSummary(l,{maxPrice:400000})[3]).toContain('above your $400,000 budget');
  expect(homeSummary(l,{areas:['Boynton Beach'],maxPrice:650000,mustHaves:['pool','no HOA']})[3]).toContain('no HOA not verified');expect(homeSummary(l,{maxPrice:650000,beds:3})[3]).toContain('matches the property criteria');
 });
 it('moves only from an open home on a current explicit request and never wraps next results',()=>{
  const s=newState('a');prepareTurn(s,randomUUID(),'Open photos');expect(requestPageAction(s,'photos','Open photos')).toHaveProperty('error');s.currentPage={listingSlug:'delray-courtyard'};s.results=['delray-courtyard','boynton-poolside'];
  const action=requestPageAction(s,'photos','Open photos');expect(action.action?.from).toBe('delray-courtyard');expect(action.action?.turnId).toBe(s.messages.at(-1)!.id);expect(requestPageAction(s,'location','Open photos')).toHaveProperty('error');
  prepareTurn(s,randomUUID(),'Go to the next result');expect(requestPageAction(s,'next','Go to the next result').action?.target).toBe('boynton-poolside');
  prepareTurn(s,randomUUID(),'Go to the next result');s.currentPage={listingSlug:'boynton-poolside'};expect(requestPageAction(s,'next','Go to the next result')).toHaveProperty('error');
 });
 it('rejects invented evidence, negated requests and stale page actions after a new turn',()=>{
  const s=newState('a');s.currentPage={listingSlug:'delray-courtyard'};prepareTurn(s,randomUUID(),"Don't open photos");expect(requestPageAction(s,'photos',"Don't open photos")).toHaveProperty('error');
  prepareTurn(s,randomUUID(),'Open photos');expect(requestPageAction(s,'photos','Scroll to location')).toHaveProperty('error');requestPageAction(s,'photos','Open photos');prepareTurn(s,randomUUID(),'Thanks');expect(s.pageAction).toBeUndefined();
 });
});
