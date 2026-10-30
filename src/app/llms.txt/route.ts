import { siteUrl,agent } from '@/lib/config';
import { communities } from '@/lib/communities';
export const dynamic='force-dynamic';
export function GET(){const base=siteUrl();return new Response(`# ${agent.name} — Palm Beach County real estate

> Buying, selling and rental help from Paul Schafranick. Contact ${agent.phone} or ${agent.email}. Pax is the website’s AI assistant.

## Public pages
- [Property search](${base}/listings): Current results and their data-source notices. Listings marked sample are fictional and unavailable.
- [About Paul](${base}/about)
- [Contact Paul](${base}/contact)
- [MLS disclosure](${base}/mls-disclosure): Attribution and data limitations.
- [Neighborhood guides](${base}/communities): Draft guides are visibly labeled for review.
${communities.map(c=>`- [${c.name}](${base}/communities/${c.slug})`).join('\n')}

## Questions and answers
Q: How do I search for a home?
A: Use the property filters or ask Pax. Both use the same listing service. Check the displayed source, status and update time, and confirm availability with Paul.

Q: Can Paul help me sell?
A: Yes. Paul offers a free local pricing review. Tell Pax about the property, your timing and plans. An email is enough for the first follow-up; a review is not an automated appraisal.

Q: Is an appointment request a booking?
A: No. Paul must confirm the time and property availability. Fictional sample properties cannot be toured.

Q: Are school assignments, HOA rules and travel times verified?
A: Only explicitly supplied listing facts are shown. Verify address-specific details with Paul and official sources.

## Privacy
Chat transcripts, contact information and lead pages are private, are not part of this public reference, and must not be inferred from sample content.
`,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=300'}});}
