# Phase 3 verification — October 29, 2026

## Story and evidence

A visitor browses samples → first-party activity endpoint → private visitor record → optional lead form/chat confirmation → same lead and activity history → independent Paul/visitor delivery queue. A signed Facebook event → durable receipt → server-side lead retrieval → the same lead/capture/delivery pipeline.

- **28 Vitest unit/integration checks passed.** This includes existing listing/AI-tool/chat/security tests and new tests for interest thresholds, time tracking, dismissal cooldown, clearing search filters, contact validation, consent-gated acknowledgments, source tagging, duplicate capture, independent email/SMS retries, Facebook raw-body signatures, Page/form allowlists, durable receipt/retrieval, consent mapping, duplicate webhooks and retrieval failure recovery.
- **30 distinct Playwright desktop/mobile checks passed after fixes**, including all Phase 1/2 regressions and the anonymous favorite → soft offer → lead form → stored activity/consent flow. Tests verify decline-and-browse, isolated visitors, sample cards/map, chat capture, requested callbacks, and Facebook challenge/signature/replay handling through real HTTP routes. Targeted reruns cover the fixed Facebook replay race and final listing/filter/favorite changes.
- TypeScript checks and the **Next.js production build** passed. The build uses the existing generated Prisma client; Prisma schema/dependencies are unchanged. The earlier engine-download restriction remains relevant to running standard `prisma generate` in this environment. Standard Windows install/migration commands remain in README.
- Browser tests use explicit local storage, deterministic chat replies and preview notification mode. HTTP Facebook tests use test-only secrets and leave retrieval pending without a Page token. Provider-fetch tests use mocked Facebook/Resend/Twilio responses. No test sends real email/SMS, calls live Meta, or makes a paid AI request.

## Issues found and fixed

- An initial anonymous session no longer silently checks the chat consent box. Existing acknowledged chats still resume normally.
- Browser activity is serialized and contact/chat submission waits for initial tracking, avoiding a first-visit cookie race.
- Both channels are independently queued/checkpointed; database lease checkpoints renew during provider operations. One channel failure does not erase a successful delivery on the other.
- Repeat Facebook events acknowledge an already committed receipt without contending with the retrieval worker. Concurrent first receipts still fail safely for retry if storage is busy.
- Blank/malformed contact is rejected before storage. Search resets remove stale filter preferences. Favorites work on both listing cards and detail pages.

## Not live-verified

Real Supabase transactions/permissions and real Meta, Twilio and Resend delivery require Paul's configured accounts. The OpenAI key is private local configuration and was not used for these tests. No live credentials are included in repository files. No new database migration is necessary: Phase 3 extends existing conversation JSON and projects source, contact and preferences into the existing lead table.

External image/tile hosts remain restricted in this environment. Browser tests exercise local image fallbacks and map marker behavior; full tile delivery depends on the laptop's internet access.

## Operating limits

- Default notification mode is off; use preview for no-send local testing and both for configured real delivery. Preview jobs are terminal test records, never automatically resent. The recovery worker must run alongside the server.
- Immediate means the initial send is attempted after saving; provider setup, network outages and worker scheduling affect delivery. Sent means API acceptance, not final delivery/read receipt. Twilio can duplicate after an ambiguous timeout; Resend uses stable idempotency keys.
- One acknowledgment per opted-in channel per website visitor/Facebook submission; no recurring marketing or new-listing alert scheduler. Twilio handles standard STOP for supported senders; no inbound conversation automation is added.
- Activity time is approximate visible-tab time sampled every 30 seconds. A browser-tab session identifies a visit. Cookie identity does not deduplicate people across devices; separate Facebook leadgen IDs are separate submissions.
- Five fictional samples only. No sample tours, automatic calendar bookings, MLS, voice, or deployment. Public photos and listings remain open.
- Private inbox/insights stay local operator commands. Supabase RLS/role restrictions remain from Phase 2. Activity, form evidence and notification payloads contain private data; keep runtime files and command output private. Production abuse controls and retention policy remain launch preparation.

## Repository hygiene

`.env`, `.env.local`, private activity/conversation files, build output and test artifacts stay ignored. `.env.example` contains only placeholders, nonsecret IDs/defaults and Paul’s approved alert recipients. Local `.env` provider/Facebook placeholders were added without overwriting the OpenAI or database credentials. No real messages were sent during implementation.
