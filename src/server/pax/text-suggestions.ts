import type { PaxState } from '../../lib/pax';
// Grounded drafts use only captured facts. No AI call or delivery is triggered by opening a lead.
export function suggestedTexts(state:PaxState):string[]{
 const first=state.lead?.name?.trim().split(/\s+/)[0]?.slice(0,40);
 const hello=`Hi${first?` ${first}`:''}, it’s Paul Schafranick.`;
 const quote=state.messages.filter(m=>m.role==='user'&&m.text.length>25&&!/@|https?:|\d{3}[- .]?\d{3}[- .]?\d{4}/.test(m.text)).at(-1)?.text.slice(0,180);
 const reference=quote?`You mentioned “${quote}”. `:'';
 const prefs=state.searches[0]?.preferences||state.preferences;
 const area=prefs.areas?.join(' or ')||prefs.area||'Palm Beach County';
 const seller=state.preferences.intent==='SELLER'||state.actions.some(a=>a.kind==='VALUATION'&&a.status==='confirmed')||state.events.some(e=>e.kind==='lead_request'&&e.detail==='VALUATION');
 if(seller)return [
  `${hello} ${reference}I can help with a free local pricing review${state.seller?.address?` for ${state.seller.address}`:""}. ${state.seller?.address?"Is there anything about the home’s condition I should know?":"What’s the property address?"}`,
  `${hello} Are you planning to sell before buying your next home?`,
  `${hello} Would a quick call help you plan the sale and your next move? What time works for you?`
 ];
 return [
  `${hello} ${reference}Thanks for your interest in ${area}. What’s the most important thing you’d like in your next home?`,
  `${hello} ${state.saved.length?(state.feedMode==='live'?'I saw you saved a home on my site. I can help confirm availability and details.':'I saw you saved a sample home on my site. I can help find comparable real homes.'):prefs.maxPrice?`I have your budget as up to $${prefs.maxPrice.toLocaleString('en-US')}.`:'I’d love to narrow down the search for you.'} Which area would you like to focus on?`,
  `${hello} ${prefs.timeline?`You mentioned “${prefs.timeline.slice(0,100)}” for your timeline. `:''}Would you like a quick call to discuss real homes and possible showings?`
 ];
}
