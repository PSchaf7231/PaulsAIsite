# Coastal homepage — October 30, 2026

The hero video is deferred at Paul's request. The existing still illustration remains for now; no stock video was downloaded, installed or claimed as finished. Next hero task: one white oceanfront mansion, a continuous flyover toward turquoise ocean, no neighborhood sweep/cuts. The earlier Pexels candidate was rejected by Paul.

## Changes

- Palm Beach Real Estate Pros branding in navigation, footer and share images; “Where Palm Beach comes home.” tagline.
- Default public origin is `https://www.pbrealestatepros.com` when `NEXT_PUBLIC_SITE_URL` is missing. Explicit public configuration still wins. Canonical links, sitemap, robots, schema and share images use this shared origin.
- Navy typography, white/sand sections, teal buttons, serif headings, spacious layout and mobile controls.
- Homepage search sends city, sale/lease, minimum/maximum price and beds to `/listings`. The existing filter UI now initializes price/bed fields from those query parameters and accepts Palm Beach as a city. No Spark, IDX, listing-detail route, Pax business logic or IDX disclaimer changes.
- Featured homes show up to six active, non-sample records from the existing feed, sorted by listing date (updated date when absent), with Sale/Lease tabs. Existing cards retain courtesy lines. If the current feed response has fewer than six, no records are invented or duplicated. The existing service's 500-record query limit remains unchanged.
- Six city tiles link straight to filtered inventory. Real place photographs are lazy-loaded directly from Wikimedia thumbnails; sources, authors and licenses are visible in the expandable photo-credit section. They are contextual photographs, not claims about today's exact appearance. CSS crops retain the original photo licenses. Remote photos depend on visitor network access; failure leaves readable city links without substituting an unrelated picture.
- Seller button prepares the existing Pax seller request in the same-page panel. Call/text links and the contact button remain available.
- No headshot blocks; brokerage is one blank config value and is omitted when blank. No stats/testimonial section. Homepage never relabels fictional samples as real featured homes.

## Try it

1. At 390px width, check there is no horizontal scroll and form controls are easy to tap.
2. Search Boynton Beach, for sale, $400K–$650K, 3+ beds. Confirm all filters carry through to the results.
3. Switch Featured homes to For Lease, and open a city tile.
4. Choose “Get my home value report”; Pax opens here with a seller request ready to send.
5. Check header/footer/share branding and About: no headshot or placeholder biography block.

## Verification

64 unit tests, all 60 desktop/mobile browser scenarios across the full run and focused rerun, TypeScript and production compilation passed. Test inventory and AI are mocked/sample fixtures; no real lead emails are sent. Local restrictions prevent a reliable end-to-end verification of external photo delivery; image errors have a graceful fallback. No Lighthouse score is claimed. Below-hero photos are lazy-loaded, fixed-size and decoded asynchronously; no video payload or animation has been added in this release.
