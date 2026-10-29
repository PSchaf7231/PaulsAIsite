# Verification — saved searches, manual texting, SEO and in-page Pax

Verified October 29, 2026.

## Automated checks

- **45 unit/integration tests** across six files passed. Coverage includes contact confirmation, visitor isolation, consent and notification modes, Facebook ingestion, saved criteria and partial updates, exact-versus-unverified matching, unsubscribe, Supabase administrator validation, six-at-a-time pagination, stable numbered references, comparison limits, filter removal, and SEO metadata/schema.
- **46 desktop/mobile browser scenarios** passed across the full suite and a focused rerun after fixing a draft-editor hydration race. The complete run passed 45 scenarios and exposed the early-edit race in the remaining desktop scenario; both desktop/mobile saved-search/lead-page scenarios then passed after the fix. Text editing is now disabled until the editor and native-SMS link are ready.
- Browser coverage includes in-page desktop/phone panels, preserved scroll and conversation/draft across navigation, current-home context, Escape/focus return, small talk without hidden searches, filter chips, numbered questions, map pins, comparison, Create alert confirmation, manual texts, protected lead pages, all eight neighborhood drafts, social PNG generation, redirects, sitemap/robots exclusions, and analytics consent/private-page exclusions.
- TypeScript type checking passed.
- Production Next.js build passed (Next.js 16.4.3).
- Desktop and phone screenshots were inspected locally. The desktop chat/results columns and mobile results section were checked in addition to automated geometry assertions.

## What these checks use

Browser tests use explicit local development storage, deterministic AI replies, test-only administrator credentials, and notification preview mode. AI SDK integration tests execute actual tool loops with mock model responses. No paid OpenAI calls, real email/SMS sends, or live Meta submissions were made. Fake test credentials are restricted to non-production local mode. The five public sample records were not expanded; pagination uses separate unit-test inventory.

The sandbox cannot retrieve Unsplash/map tiles reliably. The local image fallback and tile-failure notice were exercised; listing markers and cards still work. This is not evidence of a production provider outage.

The existing generated Prisma client was reused because Prisma binary downloads are restricted in this workspace. Schema and dependencies did not change. The production build was run directly through Next.js instead of re-running the blocked Prisma download step. Windows installation still uses `npm.cmd ci` and Prisma generation normally.

## Operational limits

- Live Supabase database connectivity, live Supabase Auth sign-in, real Resend delivery, and Meta account permissions still require configured accounts. Provider/auth boundaries have mocked coverage; live delivery is not claimed.
- Native SMS links and edited bodies were tested with desktop/mobile browser profiles. Sending from Paul’s actual iPhone/Android texting app still needs a device check. The app never marks a draft sent just because it opened the phone app. Twilio stays off unless deliberately enabled.
- Email and Facebook recovery, and newly added sample matches, require the worker to keep running. Initial follow-up is queued after capture. Provider acknowledgment is not a delivered/read receipt.
- Saved-search alerts use confirmed criteria and exact verified features only. Existing samples are baselined, so running the worker does not falsely announce all five as new. Unknown HOA/55+/private-pool details do not qualify as verified exact matches.
- All current homes are fictional samples. Showings cannot be booked for them; calls remain requests until Paul confirms. There is no MLS, voice, or public deployment in this change.
- Draft neighborhoods remain marked as drafts/noindex until Paul reviews them. Global indexing is off by default. Schema does not guarantee Google rich results or rankings.
- Responsive image optimization, a smaller hero, deferred chat, and optional Web Vitals collection are implemented. Real Core Web Vitals must be measured on the deployed site using field data; local tests do not certify them.
- Private `.env` values and stored visitor data are excluded from Git. No brokerage branding was added.

See `MANUAL-TEXTING-AND-SEARCHES.md` and `SEO-AND-GOOGLE-SETUP.md` for setup and plain-English acceptance steps.
