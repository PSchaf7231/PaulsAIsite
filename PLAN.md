# Palm Beach Living — agreed build plan

Owner: Paul Schafranick · 561-255-7285 · paul@palmbeachrealestatepros.com.
Brokerage branding is intentionally omitted while Paul changes brokerages. Do not invent a license number, experience statistics, testimonials, or credentials.

## Stack
Next.js App Router, React, TypeScript, Tailwind CSS, Node.js server routes, Prisma 7 with the PostgreSQL driver adapter, hosted Supabase Postgres, and Leaflet. Windows requires Node.js 24 LTS, not Docker. Keep secrets in server-only `.env`. No deployment in these phases.

## Phase 1 — Public foundation
Project setup; Prisma schema, migration and repeatable seed; editable agent config; homepage, listing browser/detail pages/map; eight community pages; About, Contact, Blog, Guides, Privacy, Terms, MLS Disclosure; metadata, sitemap, and RealEstateAgent JSON-LD. Five fictional examples include sale, rental, and commercial properties. Explicit sample mode permits local preview before Supabase is connected. Database errors never silently fall back to samples.

## Phase 2 — Pax
Homepage and floating chat; streaming OpenAI API calls on the server; validated listing search/details tools; results as cards and map markers. Implement remaining tool capabilities only as their supporting phases arrive. School and risk answers must use identified sources or say information is unavailable. No legal or financial advice.

## Phase 3 — Lead conversion and Facebook Instant Forms
- Website: cookie-based visitor identity, visits, viewed/saved homes, search preferences, dwell time, chats, conversion events, and dismissible natural prompts. Browsing and photos remain accessible.
- One shared lead intake service handles website and Facebook inputs; creates or matches a lead, attaches available context, sets New Lead for new contacts, and queues agent notifications and visitor acknowledgment. Repeat submissions do not reset an established lead's stage.
- Preserve both original source and individual submissions: `WEBSITE` or `FACEBOOK_INSTANT_FORM`. A returning contact can have more than one touchpoint without losing the first source.
- Facebook webhook: GET verification challenge; POST raw-body signature validation with Meta app secret; durable event receipt and fast acknowledgment; fetch form answers server-side using the authorized Page token; map names, phone/email, and custom preference fields.
- Store Facebook leadgen ID, Page ID, form ID and form name; ad/ad-set/campaign IDs where actually supplied or retrievable with granted permissions. Do not invent missing attribution.
- Use the Facebook leadgen ID as an idempotency key; retry fetch/delivery failures with backoff and an inspectable failure log. Prevent duplicate acknowledgments and agent alerts on webhook retries.
- Keep matching conservative: exact normalized contact information, no speculative person matching. Preserve raw source context with appropriate retention and access controls.
- Capture channel-specific consent and Facebook form consent evidence. Send follow-up only through an eligible channel, respect opt-outs, and route missing consent/contact details to the agent for review. Website browsing history exists only for website visits; Facebook leads receive form/ad context instead.
- Agent alerts include source, name/contact, intent summary and available property interests. Website chat starts also trigger agent notifications as specified.
- Add future CRM lead/source data in this phase; the visual admin arrives in Phase 4. Basic source fields do not depend on having the admin UI.
- Acknowledgment uses a fixed, approved Pax/agent template initially; no unsupported promises. Attach saved homes when present. Automated campaign schedules and new-listing alerts remain Phase 5.

### Facebook setup needed in Phase 3
Meta developer app, authorized Facebook Page and Instant Form, Page lead-access permissions (including `leads_retrieval` and permissions needed for webhook subscriptions), a securely stored Page access token, app secret, and verification token. Exact permission/review requirements depend on the app and Page ownership. Subscribe the Page's `leadgen` field and validate with Meta's Lead Ads Testing Tool. Local testing needs a public HTTPS tunnel for webhook delivery; hosting remains deferred. No app tokens are needed for Phase 1.

### Phase 3 tables
`visitors`, `visits`, `activity_events`, `leads`, `lead_submissions`, `saved_homes`, `search_preferences`, `communication_consents`, `communications`, `jobs`, `webhook_events`. Unique provider/event IDs protect ingestion; unique delivery keys protect messages. Phase 2 adds `conversations` and `messages` first.

## Phase 4 — Calm CRM
Single-agent admin login; six-column pipeline (New Lead, Engaged, Appointment, Under Contract, Closed, Lost); drag-and-drop plus accessible stage controls; detail page with source, contact, transcript or Facebook form context, activity, preferences, notes and next follow-up; Today; listings manager. One menu: Pipeline, Today, Emails, Settings. No main-screen charts. Tables: admin users/sessions, notes, stage history, tasks, showings.

## Phase 5 — Follow-up
Resend email, Twilio SMS, templates, AI drafts, signature, one-off sends; day 0/1/3/7 sequences with opt-outs and cancellation on reply or marked Contacted; saved-search previews, scheduled new-match emails and send logs; showing reminders and Insights including source and trigger conversion. Reuse the Phase 3 day-0 acknowledgment rather than sending another. Tables: templates, campaigns/steps/enrollments, saved searches, alert runs/matches. Authenticated Settings edits agent config and Pax instructions.

## Delivery rule
Only one phase at a time. Deliver code, new environment entries, exact run/test steps, and verification limitations. Stop after each phase and wait for “next.” No voice, IDX connection, AI staging, postcards, ad tools, or deployment now.
