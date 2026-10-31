# Palm Beach Real Estate Pros — agreed build plan

Owner: Paul Schafranick · 561-255-7285 · paul@palmbeachrentalpros.com.
Brokerage branding is intentionally omitted while Paul changes brokerages. Do not invent a license number, experience statistics, testimonials, or credentials.

## Stack
Next.js App Router, React, TypeScript, Tailwind CSS, Node.js server routes, Prisma 7 with the PostgreSQL driver adapter, hosted Supabase Postgres, and Leaflet. Windows requires Node.js 24 LTS, not Docker. Keep secrets in server-only `.env`. No deployment in these phases.

## Phase 1 — Public foundation
Project setup; Prisma schema, migration and repeatable seed; editable agent config; homepage, listing browser/detail pages/map; eight community pages; About, Contact, Blog, Guides, Privacy, Terms, MLS Disclosure; metadata, sitemap, and RealEstateAgent JSON-LD. Five fictional examples include sale, rental, and commercial properties. Explicit sample mode permits local preview before Supabase is connected. Database errors never silently fall back to samples.

## Phase 2 — Pax (expanded by Paul)
Homepage and floating entry to streamed OpenAI chat; reusable listing tools, sample cards and synchronized map; one-question-at-a-time, value-first conversion prompt; freely saved/viewed homes; persisted transcript/preferences/timeline; visitor-confirmed contact capture; stored saved searches; seller value-report requests; callback requests and operator-confirmed appointments; immediate Paul email or SMS notification adapter with durable outbox/retry worker; local inbox and session-based chats-to-leads/confirmed-appointments reporting. Notifications require provider credentials. This brings the chat-specific conversion primitives forward from Phase 3.

Use only the five fictional samples. Never claim sample tours can be booked. No calendar is connected: requested and confirmed appointments are separate. Saved search criteria are persisted, but automatic matching/alert delivery remains Phase 5. No visitor drip or marketing messages run in Phase 2. Deterministic test mode is explicit, local-only, and forbidden in production.

## Phase 3 — Lead conversion and Facebook Instant Forms (implemented)
Cookie-based anonymous views, searches, favorites, return visits and approximate visible-tab time. Dismissible offers after interest, a 24-hour refusal cooldown, open photos/listings, optional name/contact/interests/timeline capture with attached history. Shared website and Facebook capture with sources `WEBSITE` and `FACEBOOK_FORM`; individual contacts are not automatically merged across devices or sources.

Immediate email alerts to Paul and opted-in visitor email acknowledgments. Default manual texting: three editable suggestions on protected lead pages launch the native SMS app. Twilio stays behind PAX_SMS_MODE=twilio for later. Conversational draft criteria are read back and confirmed before saving; the worker sends new exact sample matches with a stop-alerts link. Durable independent deliveries, retry worker, provider acceptance status. Facebook raw-body signature validation, Page/form allowlist, durable receipt before acknowledgment, server-side Page-token retrieval, leadgen-ID deduplication, explicit consent field evidence and available form/ad metadata. Existing `PaxConversation` JSON stores activity/jobs/consent; the same `PaxLead` table stores both sources. No new tables required.

Provider credentials and Meta sender/Page setup are operator tasks documented in [PHASE3-SETUP.md](PHASE3-SETUP.md). No live MLS alerts, recurring campaigns, cross-source person matching, deployment, or full pipeline CRM in this phase. Minimal authenticated lead pages are included for manual texting and search review.

## Phase 4 — Calm CRM
Single-agent admin login; six-column pipeline (New Lead, Engaged, Appointment, Under Contract, Closed, Lost); drag-and-drop plus accessible stage controls; detail page with source, contact, transcript or Facebook form context, activity, preferences, notes and next follow-up; Today; listings manager. One menu: Pipeline, Today, Emails, Settings. No main-screen charts. Tables: admin users/sessions, notes, stage history, tasks, showings.

## Phase 5 — Follow-up
Resend email, Twilio SMS, templates, AI drafts, signature, one-off sends; day 0/1/3/7 sequences with opt-outs and cancellation on reply or marked Contacted; saved-search previews, scheduled new-match emails and send logs; showing reminders and Insights including source and trigger conversion. Reuse the Phase 3 day-0 acknowledgment rather than sending another. Tables: templates, campaigns/steps/enrollments, saved searches, alert runs/matches. Authenticated Settings edits agent config and Pax instructions.

## Delivery rule
Only one phase at a time. Deliver code, new environment entries, exact run/test steps, and verification limitations. Stop after each phase and wait for “next.” No voice, IDX connection, AI staging, postcards, ad tools, or deployment now.
