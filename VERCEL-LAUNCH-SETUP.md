# Finish setup in Vercel

The code is ready for a Spark connection. A real Spark token was not available in this workspace, so automated tests use mock responses and the five sample homes. No production database, email, OpenAI or MLS account was contacted in testing. No Spark key was copied from Hobson or Rental Pros. Before adding a token, ask Spark/BeachesMLS whether your existing license/token covers this new domain or requires a separate site approval/token; technical reuse alone does not establish permission.

## Set environment variables

Open Vercel → your PaulsAIsite project → Settings → Environment Variables. Add the values below to Production (and Preview only if desired), then redeploy. Never put tokens in GitHub, chat, or a NEXT_PUBLIC_ variable.

| Name | Value / purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Your actual public HTTPS website address, without a trailing slash. Used for canonical URLs, Facebook/text share images, schema and sitemaps. Do not use localhost in Vercel. |
| `SPARK_ACCESS_TOKEN` | Your authorized BeachesMLS Spark IDX bearer token. Server only. |
| `SPARK_API_TOKEN` | Optional alternative: Hobson's existing name. Use one token variable; `SPARK_ACCESS_TOKEN` wins when both exist. |
| `SPARK_API_BASE` | Normally leave unset. Default is `https://replication.sparkapi.com/Version/3/Reso/OData`. Only change to a Spark endpoint assigned to your account. |
| `DATABASE_URL` | Supabase transaction pooler connection string, including your URL-encoded password. |
| `DIRECT_URL` | Supabase session pooler connection string for Prisma migrations. |
| `PAX_STORAGE` | `database` on Vercel. Local file storage is development only. |
| `OPENAI_API_KEY` | Your OpenAI API key, server only. |
| `OPENAI_MODEL` | Optional; current example uses `gpt-4o`. Use a model your account supports. |
| `PAX_NOTIFICATIONS` | `email` |
| `PAX_SMS_MODE` | `manual` (Paul sends from his own phone; no Twilio required) |
| `PAX_AGENT_EMAIL` | `exppbc@gmail.com` — private lead alerts still go here. |
| `PAX_AGENT_PHONE` | `+15612557285` |
| `RESEND_API_KEY` | Resend API key for email delivery. |
| `RESEND_FROM` | Sender at a domain verified in Resend. |
| `SUPABASE_URL` | Your Supabase project URL. |
| `SUPABASE_ANON_KEY` | Supabase publishable/anon key for private-inbox authentication. |
| `PAX_ADMIN_EMAIL` | `exppbc@gmail.com`; create this user in Supabase Auth. |
| `SEO_INDEXING_ENABLED` | Set `true` when the public site is ready for indexing. Until then robots disallows crawlers. |
| `GOOGLE_SITE_VERIFICATION` | Optional Google Search Console HTML verification content. DNS verification also works. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Optional GA4 measurement ID, `G-...`; rebuild after changing. Analytics requires visitor opt-in. |

Keep `PAX_TEST_MODE` unset in Vercel. Existing migrations must be applied to Supabase with `npm run db:migrate`. No new database migration is needed for this release.

Facebook remains optional: `FACEBOOK_APP_SECRET`, `FACEBOOK_VERIFY_TOKEN`, `FACEBOOK_PAGE_ACCESS_TOKEN`, `FACEBOOK_PAGE_ID`, `FACEBOOK_FORM_IDS`, and `FACEBOOK_GRAPH_VERSION`. Field mappings and Meta setup are in [PHASE3-SETUP.md](PHASE3-SETUP.md). Leave Twilio keys blank while using manual texts. The Facebook receipt worker, saved-search alerts, and notification retries need the existing `npm run pax:worker` process on an always-running host; a normal Vercel deployment does not start that process automatically. No CRM pipeline or showing reminders were added.

## Try it after redeploying

1. Open Listings, choose a city and price, and check that actual MLS addresses appear. Ask Pax for the same criteria. Both use the same server function. Search loads up to 500 records per query; refine a broad search when the site says more inventory exists. Pax shows six cards at a time.
2. Open a home. Check photos, facts, office attribution, IDX notice and last-updated time. Its link ends with address, city, ZIP and MLS number. Ask Pax about that home, open photos, or move to the next result from your current search.
3. In a private browser, open Pax and try each starting choice. You can type directly instead. Say you need to sell first. Pax helps, offers Paul's free local pricing review and collects seller details conversationally. First contact needs only email; name/phone can come later.
4. Save a favorite, accept the soft offer and submit an email. Check the private inbox and Paul's email for the lead and its history. Seller alerts are marked SELLER. The lead page includes the full conversation and three manual-text drafts; no text sends automatically.
5. Check a shared link's preview. Its image URL must start with your public domain, not localhost. Check `/llms.txt`, `/robots.txt` and `/sitemap.xml` after enabling indexing. Live listings are split into sitemap batches, with update timestamps.
6. Temporarily test without the Spark token in a Preview deployment: the five clearly labeled samples return. A configured token that fails gives an unavailable message, never fake live homes. An empty live search stays empty. Never remove a working production token just to test.

## Google and AI referrals

Verify the domain in Google Search Console and submit `https://YOUR-DOMAIN/sitemap.xml`. In GA4 → Admin → Custom definitions, create an event-scoped dimension named **AI referral source**, event parameter `ai_referral_source`. Consent-approved visits with recognized ChatGPT, Claude, Perplexity, Copilot, Gemini or Poe referrers/UTM sources receive that value. Visits that hide their referrer cannot always be identified. Private pages, email addresses and chat messages are not sent to GA. Allowing crawlers and publishing llms.txt does not guarantee inclusion or ranking.

## Content still awaiting Paul

- The eight neighborhood guides remain labeled DRAFT and noindex until reviewed. They remain behind the small neighborhood link, not homepage guide cards.
- Paul's headshot/biography and the disclosed homepage illustration still need real material. Stats and testimonials are hidden until real values are supplied.
- Without a Spark token, sample labels and local-preview notices remain intentionally visible. They disappear in live-feed mode. A failed/missing MLS photo uses a neutral “photo unavailable” illustration; unknown facts display a dash or “not supplied.”
- Confirm the exact BeachesMLS-required IDX notice, branding and your display entitlement with the feed provider before public MLS launch. The implementation includes a BeachesMLS IDX notice, listing-office attribution and update times, but was not certified by the MLS. Paul’s brokerage remains omitted as requested.

Spark code was adapted from `PSchaf7231/hobson-concierge/lib/spark.js` at commit `033e879` (including the Media expansion and pagination behavior). The connected account returned 404 for `PSchaf7231/Palm-Beach-Rental-Pros`; that second implementation could not be inspected. Only public listing fields are exposed. No credentials were copied from another project.
