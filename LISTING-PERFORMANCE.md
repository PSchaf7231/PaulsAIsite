# Listing performance — November 5, 2026

Search and detail requests read a shared PostgreSQL snapshot instead of calling Spark per visitor. The initial listing page contains the count and up to 24 cards in server-rendered HTML. Subsequent pages also contain 24 cards. Sorting runs across the complete stored inventory before pagination; cards and map pins share the same returned page.

Fresh visits default to SALE, $750,000–$9,999,999, ascending price. Campaign tracking parameters do not remove those defaults. Explicit searches retain their requested filters. Reset still clears everything, including the typed query, using `/listings?all=1`.

Search buttons immediately show progress, searches scroll to the results, and loading never displays the empty-results message. Common typed queries use the existing local filter parser; otherwise AI interpretation has an 800 ms timeout. This parser supports city, budget, beds/baths and selected features, not arbitrary semantic property matching. Map code loads near the visible map; Madison's wrapper loads after the initial render or immediately when requested. The Anam embed and session startup are unchanged.

## Production setup

1. Vercel → pauls-a-isite → Settings → Environment Variables: add `CRON_SECRET`, a new random password of at least 32 characters, to Production. Do not use a CRM API key.
2. Keep the existing MLS credentials and PostgreSQL connection settings in Vercel. This uses the existing database; no new hosted service is required.
3. Build Command must use `npm run build`. It deploys the migration, generates Prisma, creates the initial complete MLS snapshot, and builds Next using webpack. A production MLS build fails if CRON_SECRET is missing or the initial refresh fails, keeping the previous deployment in place instead of publishing an unusable cache.
4. Deploy main. In the build logs, look for `Listing snapshot: { count: ..., checkedAt: ... }` and confirm the deployment is Ready and assigned to www.pbrealestatepros.com.
5. Vercel → project → Cron Jobs: confirm `/api/cron/listings` is registered. `vercel.json` schedules it daily at 10:00 UTC (Hobby runs within that hour). Vercel supplies the Authorization header from CRON_SECRET. After adding or changing environment variables, redeploy.

Daily refresh is chosen for the confirmed Hobby plan. Inventory can lag MLS changes by roughly a day. Pro would permit a more frequent schedule. Failed refreshes preserve the previous complete snapshot; snapshots older than 26 hours are not displayed. Monitor failed cron executions in Vercel and retry from the Cron Jobs interface. A long MLS scan fails safely after roughly four minutes; it does not publish a truncated collection. If inventory grows beyond that budget, the sync must be split into resumable scheduled batches.

The replica stores full detail photos. Public card responses include only the first photo. A 30-second per-instance memory cache reduces repeated database transfers. Refresh publication is one atomic upsert, and an advisory lock prevents simultaneous refresh jobs.

## Verification

- 94 unit tests pass, including full-inventory sorting/pagination, zero visitor MLS fetches, failed-refresh preservation, stale-cache rejection and defaults with campaign tags.
- 18 desktop/mobile browser tests pass against the local production server. These cover typed search, sorting, Reset, lease labels, HTML-rendered cards/count, default prices, map synchronization, pagination, scroll and pending empty-state handling, and preservation of Madison's embed.
- Local Next production build and TypeScript checks pass.
- Local browser tests use fictional fixtures. No claim of 1–2 second production performance is made from those tests.
- Production browser access is blocked by the Codex environment network policy (proxy CONNECT 403 / ERR_TUNNEL_CONNECTION_FAILED). GitHub's deployment-status API is also blocked. Vercel credentials are not available here. Production build status, full MLS replication, and live timings still require verification.

`node scripts/check-live-site.mjs` runs the read-only live smoke checks once network access is enabled. It includes typed searches, sort, Reset, rentals, inventory pagination and detail links. The environment must permit www.pbrealestatepros.com and pbrealestatepros.com; api.github.com is needed to read Vercel's GitHub deployment status. Real Meta verification also requires connect.facebook.net and www.facebook.com.
