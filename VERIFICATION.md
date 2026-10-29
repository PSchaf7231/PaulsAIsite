# Phase 1 verification

Date: October 29, 2026. Local cloud workspace; no deployment.

## Verified

- Five Vitest checks pass: combined filters and price boundaries, rental vs sale behavior, inactive-listing exclusion, stable sorting without source mutation, and distinct/valid sample data.
- Six Playwright flow checks pass across desktop and mobile: homepage, contact links, honest Pax preview, five cards and five Leaflet markers, synchronized filtering, empty-state reset, rental detail pages, community prefilters, and HTTP 404 for an unknown property.
- Two additional browser checks exercise the local-image fallback when external image requests fail.
- TypeScript checking passes.
- Next.js production build passes: server routes compile and 25 static outputs generate.
- Thirty public, detail, sitemap, and robots routes return HTTP 200 in sample mode.
- RealEstateAgent JSON-LD parses and identifies Paul Schafranick.
- Browser inspection found no JavaScript errors in the homepage/listing flow or horizontal overflow at tested desktop/mobile widths.
- Local hero image and all image fallbacks load; listing cards and five Leaflet markers render.
- The source manifest and package lockfile dependency lists match.

## Database setup still needs your password

The supplied Supabase project/host are in `.env.example`. The database password has not been supplied, and no connection, migration, seed, or row-level-security behavior has been tested against that live database. The SQL migration and repeatable seed are included. Run the README’s database commands after entering your password locally.

This environment blocks Prisma's binary download host. For local compilation, the Prisma 7.10.1 client was generated through matching Prisma generator packages using WASM schema parsing without downloading a schema engine. No database operation was simulated. The production Next.js build was run directly after that generation; the normal `npm run build` includes `prisma generate` and still needs access to Prisma's engine host on your laptop. The standard install/migration workflow must be confirmed there.

## External assets and limits

The environment blocks Unsplash photos and OpenStreetMap tile requests. The real Leaflet map, coordinates, marker counts, popups, and filter synchronization were checked, but background tile delivery needs verification on your laptop's internet connection. A visible tile-error message is supplied. The hero is local; failed stock images use the labeled local AI-generated illustration. Browser image-fallback tests deliberately abort external image requests and verify the local image loads.

No AI API, lead capture, tracking, Facebook webhook, outbound SMS/email, CRM authentication, campaigns, or hosting were implemented or tested. Those remain in their agreed later phases. No secrets are included in the downloadable archive.
