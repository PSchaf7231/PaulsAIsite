import { localGuides } from "./local-guides";

export type Article = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  sections?: string[][];
  body?: string;
  related?: string[];
};

export const guides: Article[] = [
 {slug:"buying-in-palm-beach-county", title:"Your first steps to buying here",category:"BUYER GUIDE",excerpt:"A practical path from the first search to the closing table.",related:["buying-a-home-in-boca-raton","buying-a-home-in-delray-beach","buying-new-construction-palm-beach-county","what-it-costs-to-live-in-palm-beach-county"],sections:[
 ["Start with the whole budget","A purchase price is only one part of owning a home. Ask a lender about financing, and budget for property taxes, insurance, association dues, utilities, maintenance, and closing costs. Any estimate is a starting point, not a loan approval."],
 ["Build a useful shortlist","Choose a comfortable price range, the areas you want to explore, and a few essential features. Visit at different times and test the routes you will use regularly."],
 ["Verify before you commit","Review inspections, flood information, permit history, insurance quotes, and association documents with qualified professionals. School assignments can change; verify the address with the district."],
 ["Keep the next step clear","Once you choose a property, your agent can help coordinate the offer process and deadlines. Your lender, inspector, title professional, and attorney each have a different role."]]},
 {slug:"preparing-to-sell",title:"Make your next move a thoughtful one",category:"SELLER GUIDE",excerpt:"Prepare your home, your paperwork, and your expectations.",related:["selling-a-home-boca-raton-delray-beach"],sections:[
 ["Gather the facts","Collect improvement records, warranties, permits, association documents, and information about known property conditions. Ask an appropriate professional which disclosures apply."],
 ["Choose useful improvements","Start with maintenance, lighting, cleanliness, and clear access to each room. Discuss whether a proposed renovation is likely to help your specific listing before spending."],
 ["Price with current evidence","Compare recent closed sales, competing listings, condition, and location. An asking price is not a guarantee of value or the final sale price."],
 ["Plan for the move","Think through showing availability, your preferred timing, and where you will go next. A clear plan makes it easier to evaluate offers beyond price alone."]]},
 {slug:"understanding-ownership-costs",title:"Look beyond the asking price",category:"OWNERSHIP GUIDE",excerpt:"The questions to ask about insurance, associations, and ongoing costs.",related:["what-it-costs-to-live-in-palm-beach-county","waterfront-vs-inland-living-palm-beach-county"],sections:[
 ["Request property-specific quotes","Insurance depends on the property, coverage, and insurer. Get current quotes and ask about roof age, wind mitigation, deductibles, and flood coverage."],
 ["Read the association documents","Review budgets, reserves, meeting minutes, assessments, restrictions, and any required memberships. Consult qualified legal or financial professionals when interpreting obligations."],
 ["Check taxes carefully","A seller's current tax bill may not reflect a buyer's future bill. Ask the county property appraiser about assessment rules and exemptions that may apply."],
 ["Leave room for maintenance","Build an allowance for routine upkeep and unexpected repairs. An inspection can help identify items that deserve closer attention."]]}, ...localGuides];
export const posts = [{slug:"a-better-home-search",title:"A better home search starts with your everyday life",category:"LOCAL PERSPECTIVE",excerpt:"Before picking a neighborhood, take a look at the week you want to live.",sections:[
 ["Start with a regular Tuesday","Where do you go most often? Work, errands, hobbies, and the people you see can help you define a useful search area more clearly than a list of must-haves alone."],
 ["Walk the area, then come back","Explore public spaces, check parking, and revisit at another time. Your own experience is more helpful than a general label about a neighborhood."],
 ["Make the tradeoffs visible","Compare space, upkeep, monthly costs, and travel time. Keep a short list of what matters most, and use it consistently as you view homes."]]}];
