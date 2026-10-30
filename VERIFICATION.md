# Verification — Spark IDX, email-first capture, sellers and launch cleanup

Verified October 30, 2026.

## Automated checks

- **62 unit/integration tests** passed across nine files: shared Spark/Pax filtering, mapping actual MLS fields, office attribution, address/MLS URLs, unknown measurements, rental categories, token aliases, authenticated pagination, malicious next-link rejection, provider sorting before limits, photo payload limits, missing-token samples, empty/live-error behavior, email-only capture, seller facts/alerts, exact saved-search matching, confirmation, consent, manual texting, Facebook boundaries, private-session isolation, AI referrals and SEO.
- **56 desktop/mobile browser scenarios** passed in a complete run. Coverage includes all three opening choices with free typing, seller recognition, email-only capture with history, private conversation/lead access, manual-text drafts, filter/map parity, numbered cards, comparison and alert confirmation, contextual home summary, expandable details, photo viewer, page controls, navigation/scroll retention, optional mocked voice typing, eight draft neighborhood pages, social PNGs, sitemap/robots/llms.txt, GA consent and AI referral tagging.
- TypeScript type checking passed.
- Production Next.js 16.4.3 build passed.

An earlier browser run exposed stale development output for the replaced sitemap route and a timing race opening Pax during navigation. The cache was rebuilt, the open action now records the current path, and the full 56-scenario run passed.

## Test boundaries

Browser tests use local development storage, deterministic AI replies, test-only administrator credentials and notification preview mode. Spark tests use RESO-shaped fixtures and mocked HTTP responses. No real Spark token was installed or copied; no live MLS request was made. No paid OpenAI call, real email/SMS send, Meta lead submission or production Supabase write was made. Real service/account configuration still needs checking after authorized credentials are entered in Vercel.

Unsplash/map tiles cannot be retrieved reliably from this sandbox; local image fallbacks and tile-failure handling were exercised. This does not indicate a production provider outage. Browser microphone behavior uses a mock speech-recognition implementation; test actual microphone/native SMS behavior on Paul's device.

The existing generated Prisma client was reused because Prisma binary downloads are restricted in this workspace. Schema/dependencies did not change. Production compilation runs directly through `node node_modules/next/dist/bin/next build`; normal Windows/Vercel installation still runs Prisma generation.

## Deployment and content

See [VERCEL-LAUNCH-SETUP.md](VERCEL-LAUNCH-SETUP.md) for environment variables and a hands-on checklist. Spark/BeachesMLS must confirm permission for this new domain and whether the existing token can be reused. With no token the site uses five labeled samples; a configured but failed live feed shows an unavailable state instead of fictitious live homes. A live query with no results stays empty.

Spark search was adapted from Hobson's source. The connected account could not access the Rental Pros repository, so no reuse from that source is claimed. Live searches load up to 500 records per query and ask visitors to refine broader searches. Sitemap batches cover the authorized active Palm Beach County feed. Only supplied public listing fields are exposed; omitted facts/photos are not invented. Exact MLS-required disclaimer/branding and photo-host availability need provider confirmation before launch.

The pipeline board and showing reminders were deliberately omitted. Existing email notifications need Resend configuration; saved-search alert checks, Facebook retrieval and retries need the existing worker running separately from Vercel. Neighborhood drafts, headshot/biography placeholders and the disclosed hero illustration still need Paul's review/material. Stats/testimonials remain hidden.
