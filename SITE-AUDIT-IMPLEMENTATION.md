# Site audit and Follow Up Boss setup

Changes are in the working tree; they have not been deployed to Vercel.

## Lead routing

Home and contact forms submit name, phone, email, buying/selling/renting intent,
and message to `/api/pax/lead`. A successful durable save redirects to `/thank-you`.
The existing conversation database and `/admin/leads` inbox retain the lead,
preferences, and viewed/saved properties. No separate Hobson service endpoint was
present or supplied; the existing durable notification worker is retained.

Agent email uses `PAX_AGENT_EMAIL`, `RESEND_API_KEY`, and `RESEND_FROM`. Each
agent email CCs `FUB_LEAD_EMAIL` (default `nextendeavorcre@followupboss.me`).
Lead acknowledgement emails require the existing explicit consent.
Follow Up Boss events create/update a person with source
`PB Real Estate Pros website`, contact information, message, and viewed properties.
Failed integrations retry through the existing queue; run `npm run pax:worker`
as a persistent worker or scheduled job. After five delivery failures, inspect
`npm run pax:inbox` and use the existing retry command. A form success means the
request was stored, not that downstream providers have acknowledged delivery.
Submitted event IDs deduplicate client retries. External delivery is at least once;
check CRM duplicates after ambiguous provider timeouts.

## Production settings still required

In Vercel, securely set **server-only** `FUB_API_KEY` using a rotated key; the key
shared in chat was not saved. Also configure existing database and Resend settings.
This session has no Vercel connection or token, so remote settings were not changed.

Meta Pixel `733196970795080` is configured as the shared browser/server public
default; override it with `NEXT_PUBLIC_META_PIXEL_ID` (empty disables Meta).
The real `NEXT_PUBLIC_GA_MEASUREMENT_ID` is still needed. Clarity project `z8lkd7mqv0` is configured
as the public default and can be overridden with `NEXT_PUBLIC_CLARITY_PROJECT_ID`
(set it to an empty string to disable Clarity). Paul’s FL license number, 63016579, is saved
in `config/agent.json` and displayed with his name in the footer. Set `META_CONVERSIONS_ACCESS_TOKEN` server-side.
Rebuild after changing public variables. Trackers with missing/placeholder IDs do not load.

Tracker `WT-OGUKSOSV` is installed in the root layout. In Follow Up Boss, verify
**Form Capture OFF**; this dashboard setting cannot be enforced by the supplied
tracking snippet and was not changed here. API intake and notification email
routing are intentional; the pixel must remain activity-only.

GA4 records `generate_lead` and `contact`; Meta records `Lead` and `Contact`.
The browser Lead and server Conversions API Lead share an event ID for deduplication.
Optional GA4, Meta, and Clarity follow the site's existing analytics opt-in.
Clarity receives `listing_view_count` on property navigation and `property_shared`
after a successful share/copy. No lead PII is included in browser event payloads;
CAPI hashes email and phone identifiers.

## Team naming conflict

The newer Team page contains a separate Pax AI Strategist card in addition to
Madison. The user confirmed that the Team page should retain that existing card;
other assistant-facing site copy uses Madison.

## Anam limitation

The exact Anam embed HTML and agent configuration are unchanged. It is an isolated
iframe with no documented host callback in this repository. Therefore lead capture
inside Anam and a real `anam_session_start` event cannot be verified or connected
from the parent site. Opening the window is not reported as a session start.
The user confirmed that the embed must remain untouched and only website forms
should be connected. No substitute
lead handler or fabricated event was added.

## Verification

After environment reconnection, verified Prisma client generation succeeded with
access to binaries.prisma.sh and checksum verification intact.

- `npm test`: all 83 tests passed across 14 suites.
- `npm run typecheck`: passed.
- `npx next build --webpack`: production compilation, TypeScript checks and static
  page generation passed. This check did not run production database migrations.
- `git diff --check`: passed.

Provider integration tests use mocked requests; production CRM/email delivery,
Anam sessions, live MLS access, and Vercel deployment are not verified by these
checks. Existing browser tests were not run and several still describe older UI.
The audit identified outstanding issues: homepage typed requests are not passed
into the unchanged Anam iframe; sort changes require another Search click; reset
applies a $1 million minimum and house filter; rental price choices need review.
Those audit items are not fixed by this change.

Madison's launcher image is a 320×320 WebP, 13,358 bytes versus a 358,982-byte
PNG, preloaded in the root layout. The iframe contents are unchanged. No valid
Lighthouse mobile report was completed and no sub-2.5-second load claim is made.
Run a production mobile audit and test inside Facebook's browser before paid ads.
