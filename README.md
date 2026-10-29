# Palm Beach Living — Phase 3: lead conversion

For **Paul Schafranick** · 561-255-7285 · paul@palmbeachrealestatepros.com. Brokerage branding remains omitted. Local development only; nothing is deployed.

**Latest update:** [Manual texting, private lead pages, conversational saved searches and sample alerts](MANUAL-TEXTING-AND-SEARCHES.md). Twilio is off by default.

**Original Phase 3 setup:** [Windows setup, Twilio/Resend keys, Facebook hookup, and plain-English tests](PHASE3-SETUP.md).

Pax now provides streamed AI chat, sample listing search/cards/map, freely saved homes, preference and timeline tracking, confirmed contact capture, saved-search criteria, seller report requests, callback requests, and a durable Paul-notification queue. It uses only the **five fictional sample listings**. No MLS or Vapi integration is connected.

## Update and run on Windows

Install **Node.js 24 LTS**. If you use Git, run `git pull origin main`. Otherwise download **Code → Download ZIP** from GitHub and extract it into a new folder. Copy your existing private `.env` into the new project folder; do not overwrite it with `.env.example` or upload it to GitHub.

Open PowerShell in the folder containing `package.json`. Double-click **Open-env.cmd** to open `.env` in Notepad. It creates the file from `.env.example` only when `.env` does not exist.

Keep your existing Supabase connection strings. Add the new entries from `.env.example` to your private `.env`, especially:

```dotenv
LISTINGS_SOURCE="sample"
SITE_URL="http://localhost:3000"
OPENAI_API_KEY="YOUR_OPENAI_API_KEY_HERE"
OPENAI_MODEL="gpt-4o"
PAX_STORAGE="database"
PAX_NOTIFICATIONS="email"
PAX_SMS_MODE="manual"
```

The OpenAI key is a server-side API key with API billing enabled, separate from a ChatGPT subscription. Never put it in `config/agent.json`, a `NEXT_PUBLIC_` variable, or GitHub. `OPENAI_MODEL` can be changed to another tool-capable model available to your OpenAI account. The configured default follows the original gpt-4o brief; model availability must be verified with your account. Do not add your future MLS key yet.

`LISTINGS_SOURCE=sample` controls public browsing. Pax is independently pinned to the same five sample records in this phase, so future changes to that environment variable cannot accidentally enable MLS tool access. `PAX_STORAGE=database` stores chat and conversion records in Supabase; it does not select the listing feed.

Run these commands one at a time:

```powershell
npm.cmd ci
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run dev
```

Open **http://localhost:3000/pax** or the homepage’s chat panel. Keep PowerShell open; Ctrl+C stops the server. If using another port, update `SITE_URL` to the exact browser origin and restart; the chat API deliberately rejects other origins.

### Supabase connection strings

The template contains your project reference `ztkihbwbkzaugqymsxpy` and host `aws-1-ca-central-1.pooler.supabase.com`. `DATABASE_URL` uses the transaction pooler on port 6543; `DIRECT_URL` uses the session pooler on port 5432 for migrations. Replace `ENCODED_PASSWORD` in both with your URL-encoded **database password**, not your Supabase account login. Keep `sslmode=require`.

Prisma 7 uses `prisma.config.ts` for its migration URL and a PostgreSQL driver adapter for runtime connections. Do not rerun `prisma init` or copy the older Prisma 6 datasource URL syntax into the schema. No Docker is needed. `db:migrate` applies both committed migrations without a shadow database. Tables use row-level security with anonymous/authenticated Data API access revoked; only server-side database credentials access them.

## Instant Paul alerts and lead acknowledgments

See [PHASE3-SETUP.md](PHASE3-SETUP.md) for exact provider account/key instructions and Facebook setup. Use `PAX_NOTIFICATIONS="email"` and `PAX_SMS_MODE="manual"` after configuring Resend. Twilio is optional later. Paul’s alerts go by email to **exppbc@gmail.com** with a private lead-page link. Three suggested texts open your phone’s texting app. Lead acknowledgments use separately opted-in channels; no recurring drip campaign runs. The worker checks confirmed searches for new matching samples. Keep `npm.cmd run pax:worker` running for recovery/retry. Use `preview` for local tests with no real sending.

## What to test

1. Acknowledge the chat notice and ask: **“Find a 3-bedroom home in Delray under $600k.”** Expect a short answer, a matching fictional sample card, and the same map marker. Pax should ask one follow-up question, not a list.
2. Try an impossible price/area combination. Expect no invented properties and a useful next step.
3. Click **Save this home** without providing contact. It should save freely and offer a relevant next step. Open a property and return to chat; viewed/saved history persists after reload.
4. Say **“I like this. Can Paul follow up?”** Supply only your own test contact when asked. Confirm the short card. `pax:inbox` should show one lead with the earlier transcript, preferences, timeline, and saved/viewed homes. Repeated confirmation must not create duplicate leads or notifications.
5. Try **“No thanks, just browsing.”** Pax should continue helping without an immediate repeated contact ask or a search wall.
6. Say **“We need to sell first.”** Expect an offer for Paul’s free home value report and one next question. Pax must not invent a valuation.
7. Say **“I’m pre-approved and moving within 60 days.”** Check the recorded hot signal and, after configuring a notification provider, verify Paul receives a short alert. With notifications off, inbox status must say unconfigured, not sent.
8. Ask for a showing. Pax must explain samples cannot be toured and offer a call about comparable real homes. Supply a preferred call day/time/timezone and contact, then confirm. Status should be **REQUESTED**, never silently booked.
9. Ask to save search preferences. Confirm the card. It must read back all criteria before confirmation and explain that matching alerts currently use fictional samples.
10. Open an incognito/private browser: the prior visitor’s messages/contact must not appear.
11. On a phone-width screen, check the input, confirmation cards, map, and save buttons. No account is required to browse.
12. Remove the OpenAI key temporarily and restart. Pax should show a useful unavailable state with browsing/contact links, not simulated AI replies. Restore the key afterward.

## Inbox, actual confirmations, and conversion reporting

Use `/admin/leads` for the private lead inbox and manual text drafts (Supabase Auth setup in the latest guide). These **local operator commands** also remain available:

```powershell
npm.cmd run pax:inbox
npm.cmd run pax:insights
```

The inbox contains private contact details and transcripts: do not paste it into public issues. It includes notification status, seller requests, preferences, saved/viewed slugs, and appointment request IDs. The schema also projects confirmed contacts, appointments, and saved searches into `PaxLead`, `PaxAppointment`, and `PaxSavedSearch` tables for the later CRM.

After you have personally agreed on a call time with the visitor, mark it confirmed using the actual future date/time and the appointment request ID shown in the inbox:

```powershell
npm.cmd run pax:confirm -- APPOINTMENT_ID "2026-11-07T10:00:00-05:00"
```

Replace both example arguments. This records a confirmation and adds it to the visitor’s chat history; it does not send an external calendar invitation or contact the visitor for you. Confirm the time with the visitor directly first.

Insights reports total leads, website/Facebook lead counts, anonymous visitors, chats, captured leads, leads with appointment requests, leads with confirmed appointments, chats-to-leads, and leads-to-confirmed-appointments. It counts conversation sessions, not deduplicated humans across devices. An unconfirmed request never counts as a booked appointment. There are no main-screen charts.

## Agent config and architecture

- `config/agent.json`: Paul’s branding/contact details, verified stats/reviews, optional headshot/logo, and Pax personality. Add only approved factual content; missing stats/reviews remain labeled.
- `src/server/pax/prompt.ts`: value-first, one-question, earned-ask, refusal, seller, hot-lead, factual-grounding, and truthful-action rules.
- `src/server/pax/tools.ts`: reusable tool factory for listing search/details, save, preferences, contact, saved searches, calls/showings, seller reports, school resource and affordability illustration. Future voice adapters can reuse this factory and the same confirmation/service layer.
- `src/server/pax/state.ts`: conversion rules, sample results, events, consent-confirmed actions, notifications, and metrics.
- `src/server/pax/store.ts`: database transactions/leases plus an explicit local-development file store. User turns are checkpointed before AI execution, so provider failure does not erase them. Retry IDs and confirmation statuses prevent duplicate effects.
- `src/app/api/pax/`: same-origin POST validation, limited body/message sizes, HTTP-only random session cookie, server-authoritative history and per-session turn limits. Callers cannot supply system messages, other conversation IDs, or trusted tool results.
- `src/components/pax-chat.tsx`: streamed plain-text replies (no model HTML), synchronized cards/map, one-action confirmation, recovery and empty states.
- `prisma/migrations/202610290002_pax/`: conversation, lead, appointment, saved-search schema. Notification outbox and activity events are part of the atomically saved conversation record.

As with Phase 1, the site remains noindex/local-only. Production deployment, global/distributed abuse controls, retention policy, and real service delivery checks are part of launch preparation; this phase does not deploy the site.

## Automated tests

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd exec playwright install chromium
npm.cmd run test:e2e
```

Stop your running dev server before browser tests. Playwright starts an isolated test-mode server using `.pax-test-data/`, the five samples, deterministic chat replies, and preview notifications. It never calls OpenAI or sends messages to real recipients. Test mode is visibly labeled, is not the default, and is rejected in production or database-storage mode. One unit/integration test exercises the actual AI SDK tool loop using its mock model provider. Live prompt quality and provider delivery still require your account credentials and a manual acceptance pass.

For a local preview without Supabase, explicitly set `PAX_STORAGE="local"` while keeping a real `OPENAI_API_KEY` for live AI. Records then persist in ignored `.pax-data/`, never silently fall back from a failed database. This mode is blocked in production. If the dev process crashes mid-write, a stale `.lock` file may remain there; stop all app/worker processes before removing only the stale lock file. Do not delete the JSON record unless you intend to delete that conversation.

## Remaining phases

Facebook Instant Forms ingestion, broader anonymous conversion triggers, visitor thank-you delivery and CRM integration continue in Phase 3. The CRM interface remains Phase 4; scheduled alerts, email templates, drips and reminders remain Phase 5. Vapi and MLS access remain later work. See `PLAN.md` and `VERIFICATION.md` for exact scope and test limits.

## SEO and in-page Pax

See [SEO and Google setup](SEO-AND-GOOGLE-SETUP.md) for draft neighborhood reviews, Search Console, optional Analytics and the persistent desktop/mobile chat panel. Indexing stays off by default while the site contains sample data and unreviewed copy.
