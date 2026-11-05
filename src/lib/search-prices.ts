export const salePrices=[250000,...Array.from({length:200},(_,i)=>(i+2)*250000)];
export const rentalPrices=[3500,4000,4500,5000,6000,7500,10000,12500,15000,20000,25000,35000,50000,75000,100000];
export function searchPriceLabel(value:number,rental=false){return rental?`$${value.toLocaleString('en-US')} / month`:value>=1000000?`$${value/1000000}M`:`$${value/1000}K`;}
