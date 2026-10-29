# Phase 3 — lead conversion setup

**Updated workflow:** [Manual texting and conversational saved searches](MANUAL-TEXTING-AND-SEARCHES.md). Email alerts and manual texts are now the default. Twilio below is optional for later.

## What works now

Visitors can browse every photo and property without registering. A random, first-party, HTTP-only cookie connects views, searches, favorites, visits and approximate visible-tab time to a visitor for 30 days. Three distinct property views, a favorite, or a return visit earns a dismissible Pax offer. “Not now” pauses those offers for 24 hours. There is also a permanent, optional “Ask Paul to follow up” form near the footer.

A submitted form or confirmed chat contact attaches the prior activity to a lead. Name, phone/email, interests and timeline are stored; at least one contact channel is required. The website form collects a name and timeline; chat asks one question at a time and can accept contact before those are known. SMS and email acknowledgments require separately selected channel permission. Sharing a phone number alone is not permission for automatic texts.

Each new lead queues an **email alert to Paul at exppbc@gmail.com**, with a link to the protected lead page and its three manual text drafts. Opted-in leads can receive email acknowledgments. Automatic SMS to Paul/leads requires the optional Twilio setting. One provider failing does not prevent the other channel succeeding. The initial attempt runs immediately after saving; a worker recovers failed/interrupted attempts. Provider acceptance is recorded, not proof of final delivery or reading.

Facebook Instant Forms use this same capture/delivery service and `PaxLead` table with source **FACEBOOK_FORM**; website source is **WEBSITE**. The signed webhook saves a durable receipt before acknowledging Meta, then retrieves answers using your Page token. Duplicate Meta deliveries cannot create another lead or acknowledgment for that leadgen ID. Facebook records include lead, Page, form, supplied answers/consent evidence, submitted time and ad ID when returned. Facebook activity is form context, not invented website visits.

The five fictional listings remain. Confirmed conversational saved searches now check for new matching samples; real MLS alerts need the later MLS feed. Sample homes cannot be toured. Requests to discuss real showings go to Paul; appointments are not automatically booked. No recurring drip campaign, Vapi, MLS connection, CRM dashboard, or deployment is included.

## 1. Update the project on Windows

1. Install Node.js **24 LTS** if needed.
2. In your project folder, run `git pull origin main`. If you downloaded a ZIP instead, download a fresh ZIP from GitHub → Code → Download ZIP, extract it, and copy your private `.env` into the new folder.
3. Double-click `Open-env.cmd`. Keep your real Supabase connection strings and OpenAI key. Copy the new placeholder settings from `.env.example` into your local `.env`. Never upload this file.
4. Open PowerShell in the folder containing `package.json`, then run:

```powershell
npm.cmd ci
npm.cmd run db:migrate
npm.cmd run dev
```

Phase 3 reuses the Phase 2 tables; its new activity, consent, webhook and outbox fields live in `PaxConversation.data`. `PaxLead.source` and preferences are projected transactionally into the lead table. No new migration is required if Phase 2 migrations already ran. The website works with `LISTINGS_SOURCE="sample"` without reseeding.

Keep `PAX_STORAGE="database"` to use Supabase. Keep `SITE_URL="http://localhost:3000"` for normal local use. If you use a different browser address, update it to exactly that origin and restart.

## 2. Try it without sending real messages

Set `PAX_NOTIFICATIONS="preview"` in `.env`, restart the dev server, and open http://localhost:3000/listings. This development-only mode records preview delivery status and sends nothing.

1. Save a home without sharing any contact. Look near the bottom for Pax’s optional suggestion.
2. Choose **Not now**, open more listings, and verify photos and searching stay open.
3. Click **Ask Paul to follow up**, fill in your own test name/contact, interests and timeline, and select the SMS/email acknowledgment checkboxes if desired.
4. Submit. In a second PowerShell window, run `npm.cmd run pax:inbox`. Your lead should show source WEBSITE, activity, interests, timeline, consent and separate deliveries. Run `npm.cmd run pax:insights` for source totals and conversion counts.
5. In a private browser, the previous visitor’s details must not appear. A new tab with the same cookie is treated as a return visit; page reloads in the same tab do not inflate visits. Time is an approximate 30-second visible-tab sample, not exact attention measurement.
6. Try Pax chat too. Confirming its contact card uses the same channel choices and notification queue.

Preview messages are terminal test records and are **not resent** when you later switch to live mode. Use a fresh private-browser visitor and a new test Facebook lead for live checks. `off` records unconfigured jobs instead; those can send later when enabled, so inspect the inbox before switching to live mode.

## 3. Accounts and keys for real texts and emails

### Optional later — Twilio: automatic texts

Create a Twilio account at https://www.twilio.com/ and obtain:

- `TWILIO_ACCOUNT_SID`: Console → Account information (starts with AC).
- `TWILIO_AUTH_TOKEN`: the matching account Auth Token. Keep private.
- `TWILIO_FROM_NUMBER`: a purchased SMS-capable Twilio number, in `+1...` format. This is **not** Paul’s personal number.

Complete Twilio’s required US sender registration: A2P 10DLC brand/campaign for a local number, or toll-free verification for a toll-free number. Follow Twilio’s current registration requirements for your selected sender. Trial accounts can only send to verified recipients. Twilio handles standard STOP opt-outs for supported senders; test STOP with your own phone before enabling visitor traffic. This phase has no inbound SMS conversation handler.

### Resend: email Paul and opted-in leads

Create a Resend account at https://resend.com/. Add a domain you control, add the DNS verification records Resend provides, and verify it. Create a sending API key with access to that domain.

- `RESEND_API_KEY`: Resend → API Keys.
- `RESEND_FROM`: for example `Pax <pax@palmbeachrealestatepros.com>` **only after verifying that domain**. A Gmail address cannot be used as an unverified sender.
- Paul’s Gmail address is the recipient and reply-to; it does not require a Gmail password or Gmail API key.

Set locally:

```dotenv
PAX_NOTIFICATIONS="both"
PAX_SMS_MODE="twilio"
PAX_AGENT_EMAIL="exppbc@gmail.com"
PAX_AGENT_PHONE="+15612557285"
TWILIO_ACCOUNT_SID="YOUR_ACCOUNT_SID"
TWILIO_AUTH_TOKEN="YOUR_AUTH_TOKEN"
TWILIO_FROM_NUMBER="YOUR_SMS_CAPABLE_TWILIO_NUMBER"
RESEND_API_KEY="YOUR_RESEND_SENDING_KEY"
RESEND_FROM="Pax <YOUR_VERIFIED_SENDER>"
```

Restart the app. In a second terminal keep this running:

```powershell
npm.cmd run pax:worker
```

Submit a **fresh** test visitor using your own phone and email with both channel boxes checked. Check Paul’s phone and Gmail, then both visitor channels. If a channel is absent or not opted in, it will not receive an automatic acknowledgment. Delivery status appears in `pax:inbox`; provider dashboards show delivery failures beyond API acceptance. `npm.cmd run pax:retry` performs one retry pass. Backoff stops after five failed delivery attempts; inspect failed records before any manual recovery. Resend reuses idempotency keys; Twilio can duplicate a text after an ambiguous timeout, so exactly-once SMS delivery is not promised.

The public website contact email stays paul@palmbeachrealestatepros.com. Only Paul’s notification recipient/reply-to changes to exppbc@gmail.com.

## 4. Facebook Instant Forms

You need a **Meta Business Portfolio**, a Facebook Page you manage, a lead-generation Instant Form, and a **Meta developer app** authorized for that Page. Create/manage the app at https://developers.facebook.com/.

Set these private/local values:

| Setting | Where it comes from |
| --- | --- |
| `FACEBOOK_APP_SECRET` | App dashboard → Settings → Basic → App secret |
| `FACEBOOK_VERIFY_TOKEN` | A long random string you create; enter the same value in webhook setup |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | A Page access token issued for your app and Page, with lead access |
| `FACEBOOK_PAGE_ID` | The numeric ID of Paul’s authorized Facebook Page |
| `FACEBOOK_FORM_IDS` | Comma-separated numeric IDs of the allowed Instant Forms |
| `FACEBOOK_GRAPH_VERSION` | A supported Graph API version selected in your app (template uses `v24.0`; update when required by Meta) |
| `FACEBOOK_INTEREST_FIELD` | Actual field-data name for your “What are you looking for?” question; default `looking_for` |
| `FACEBOOK_TIMELINE_FIELD` | Actual field-data name for timeline; default `timeline` |
| `FACEBOOK_SMS_CONSENT_FIELD` | Actual field-data name for explicit automated-text permission; default `sms_consent` |
| `FACEBOOK_EMAIL_CONSENT_FIELD` | Actual field-data name for explicit automated-email permission; default `email_consent` |

Standard contact fields are `full_name` (or `first_name` + `last_name`), `email`, and `phone_number`. Add separate optional Yes/No questions for SMS and email acknowledgment permission, with the same identity, optionality, rates and STOP wording shown on the website. Only an exact case-insensitive **Yes**, **true**, or **1** counts as permission. Missing/No values still create a lead and alert Paul, but do not automate that visitor channel. Inspect actual `field_data` names using Meta’s tools; custom display labels and API field names can differ.

Authorize `leads_retrieval`, `pages_manage_metadata` for Page webhook subscription, and `pages_show_list` / `pages_read_engagement` where required by your token-acquisition flow. Assign the app/integration lead access in your Business Portfolio’s Leads Access settings and ensure the token’s user/system user has the appropriate Page task. App review, Advanced Access, business verification and Live mode requirements depend on ownership and whether you serve people outside the app’s roles; follow your app dashboard’s requirements. Development-mode tests alone do not establish public lead access. Use an appropriately maintained Page token and replace it if revoked/expired. Never put it in browser code or GitHub.

### Connect and test the webhook

1. The app must be reachable at a public **HTTPS** address. For a local test, run an HTTPS tunnel to localhost:3000 using a service you choose, or use your eventual hosting. This task does not deploy or create a tunnel.
2. Set `SITE_URL` to the tunnel’s HTTPS origin if browsing through it; restart the app. Callback URL: `https://YOUR-HOST/api/webhooks/facebook`.
3. In the Meta app’s Webhooks product, choose **Page**, enter that callback URL and your `FACEBOOK_VERIFY_TOKEN`, verify it, and subscribe to **leadgen**.
4. Subscribe the actual Page to your app too. Using Meta Graph API Explorer or your server-side administration, issue `POST /PAGE_ID/subscribed_apps` with `subscribed_fields=leadgen` and the authorized Page token. Confirm with `GET /PAGE_ID/subscribed_apps`. App webhook registration alone is not sufficient.
5. Keep the app **and `pax:worker`** running. Use Meta’s **Lead Ads Testing Tool** at https://developers.facebook.com/tools/lead-ads-testing/ with the allowed Page/form. Delete the prior test lead before creating another when the tool requires it.
6. Inspect `pax:inbox`: source FACEBOOK_FORM, Page/form/lead IDs, supplied answers, consent and delivery statuses. Meta webhook retry/replay of that same lead ID must not send another acknowledgment. A new lead ID is a new submission.
7. Test the real form with your own phone/email and each opt-in combination. Meta’s default test answers may not include your custom consent fields, so they may correctly produce no visitor follow-up. Paul still gets the lead alert.

POST requests require `X-Hub-Signature-256` computed from the **raw body** and App secret. Invalid signatures are rejected. Unknown Page/form IDs are ignored. Retrieval failures remain pending with backoff (up to ten attempts) and an inspectable error in the local inbox; no partial lead is invented. Missing configuration leaves retrieval pending until configured. Keep the worker running on any always-on deployment as a separate process or scheduled job; Next’s immediate response hook alone is not a scheduler.

## Data and operational boundaries

- Private records stay in Supabase or the explicitly selected development file store. The new `/admin/leads` pages require Paul’s Supabase Auth sign-in; visitor pages do not expose the inbox.
- Lead IDs are stable per website visitor cookie or Facebook leadgen ID. Different devices, cleared cookies, or different Facebook submissions may create separate leads even with the same email; no speculative cross-source person merge occurs. A later CRM can merge reviewed duplicates.
- Activity, outbox jobs and Facebook receipt state share the existing conversation transaction/lease. Private inbox output contains PII; never paste it into public issues.
- No new dependency, database service, Docker installation, Facebook Pixel, or browser-side provider key is required.
- Supabase/OpenAI setup remains in README. External provider credentials and actual sender/Meta approvals are required to verify real delivery; passing local mock tests does not establish those accounts are ready.
