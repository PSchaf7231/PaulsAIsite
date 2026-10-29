# Phase 2 verification — October 29, 2026

## Passed locally

- **20 Vitest unit/integration checks**: exact sample search/no fabricated matches; freely saved homes; capture only after confirmation; attached viewed/saved history; refusal cooldown; duplicate confirmation and turn IDs; requested versus confirmed appointment metrics; sample-only search status; hot-signal handling; affordability assumptions; hourly limits; persistence checkpoints and locking; same-origin/body-size checks; notification configuration, provider request/idempotency, and failed-delivery retry; production test-mode rejection; unavailable OpenAI behavior.
- An actual **AI SDK ToolLoopAgent** runs a search tool and continues to a response using the SDK's deterministic mock model. This exercises the production tool factory/agent configuration without a paid live model call.
- **24 Playwright checks across desktop and mobile**, including the Phase 1 regressions and the full Pax browser → API → local persistence → response flow. Tests cover sample results/map, save without contact, resume, viewed-home logging, lead confirmation and duplicate replay, saved searches, callback requests, decline-and-continue, seller/hot signals, and isolation of another visitor. Cross-origin confirmation requests are rejected. Two additional slow-session checks verify that an initial lookup cannot clear a visitor’s consent.
- Desktop and mobile visual inspection shows no horizontal overflow, no page JavaScript errors, and matching sample cards/markers.
- TypeScript passes. Next.js production compilation and prerendering pass (28 static outputs, with three dynamic Pax API routes). No dynamic-filesystem tracing warnings remain in the final build.
- Deterministic browser test mode is visibly labeled, explicitly enabled only by test settings, and rejected in production/database-storage mode. Test notifications are preview-only. The test suite sends no real email/SMS and makes no live OpenAI calls.

## Live verification still requires Paul's local credentials

- No OpenAI key, real Supabase password, Resend key, or Twilio credentials were available here. Live model behavior, Supabase migration/transactions/RLS, and real provider delivery are **not verified**. Follow the README's acceptance prompts and notification checks after configuring them locally.
- `PAX_NOTIFICATIONS=off` is the shipped default. That records an unconfigured outbox status; it never reports a successful send. Enable email or SMS and keep the retry worker running for retry delivery.
- This environment blocks Prisma's schema-engine download host. The matching Prisma 7.10.1 client was generated locally through Prisma's generator packages and WASM schema parsing without downloading the engine. The Next.js production build then ran directly. Normal `npm run build` includes the standard `prisma generate`; standard installation/migration must be confirmed on the Windows laptop with engine-host access.
- External Unsplash and OpenStreetMap asset hosts are restricted here. Local illustrative image fallbacks, Leaflet map behavior, and marker counts are tested; background tile delivery still needs the laptop's internet connection.

## Intentional behavior and limits

- Only the five fictional samples are searchable by Pax. No MLS key or Vapi/voice code is introduced.
- Contact capture requires a visitor-confirmed card. A call is a request until Paul confirms it with the operator command after agreeing the time with the visitor. Fictional sample showings are rejected. No calendar invitation is fabricated.
- A saved search stores criteria; it does not claim scheduled alerts are active. Seller reports are requests for Paul, not fabricated valuations. Visitor marketing and drips are not sent.
- A 30-day HTTP-only conversation cookie identifies each chat. Metrics are session-based, not cross-device person counts. Private inbox/confirmation/insights operations are local CLI commands, with no public admin API.
- Notifications use an atomic durable outbox within the conversation. Resend requests carry idempotency keys. Twilio retries are at-least-once and may duplicate a message after an ambiguous network failure. Provider acceptance is not proof the recipient read the message.
- Local file persistence is explicitly development-only and requires removing a stale lock after a crashed process, with all app/worker processes stopped. Production must use database storage. This is still a local-only phase; launch controls and retention policy remain launch preparation.

## Privacy and repository hygiene

`.env`, `.env.local`, `.pax-data/`, `.pax-test-data/`, build output, screenshots, and temporary files are ignored. Only empty/placeholder service credentials appear in `.env.example`. The privacy draft now describes actual chat storage, OpenAI processing, and Paul notifications. No secrets or private runtime records belong in Git commits.
