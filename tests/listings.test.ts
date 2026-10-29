import { describe, it, expect } from "vitest";
import { filterListings, listingPrice, type Listing } from "../src/lib/listings";
import samples from "../src/lib/sample-listings.json";
const listings = samples as Listing[];
describe("Property browsing",()=>{
 it("combines city, purchase type, bedrooms and inclusive budget",()=>{
  expect(filterListings(listings,{city:"Delray Beach",type:"SALE",beds:3,minPrice:585000,maxPrice:600000}).map(l=>l.slug)).toEqual(["delray-courtyard"]);
  expect(filterListings(listings,{city:"Delray Beach",maxPrice:584999})).toHaveLength(0);
 });
 it("separates monthly rentals from sale inventory",()=>{
  const rentals=filterListings(listings,{type:"RENT"});
  expect(rentals).toHaveLength(1);expect(listingPrice(rentals[0])).toBe("$3,400 / month");
  expect(filterListings(listings,{type:"SALE"})).toHaveLength(3);
 });
 it("excludes inactive listings and does not mutate the source",()=>{
  const source=[{...listings[0],status:"SOLD"},...listings.slice(1)];
  const before=JSON.stringify(source);const result=filterListings(source,{sort:"price-desc"});
  expect(result).toHaveLength(4);expect(result[0].price).toBe(925000);expect(JSON.stringify(source)).toBe(before);
 });
 it("returns no matches for incompatible filters",()=>{expect(filterListings(listings,{type:"COMMERCIAL",beds:3})).toEqual([])});
 it("has five distinct, explicitly fictional samples with valid map coordinates",()=>{
  expect(new Set(listings.map(l=>l.slug)).size).toBe(5);
  listings.forEach(l=>{expect(l.isSample).toBe(true);expect(l.latitude).toBeGreaterThan(26);expect(l.latitude).toBeLessThan(27.5);expect(l.longitude).toBeLessThan(-79);expect(l.photos.length).toBeGreaterThan(0)});
 });
});
