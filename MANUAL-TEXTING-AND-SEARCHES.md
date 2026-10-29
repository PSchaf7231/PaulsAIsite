# Manual texting and conversational saved searches

## What changed

Paul gets an **email** when a lead arrives. It includes a link to the private lead page. The page shows **three editable suggested texts**, based on the lead’s recorded interests. Tap **Open text** on your phone to open its texting app with the recipient and message filled in. Review and press Send yourself, from your own number. The website never marks a draft as sent just because an app opened. Copy buttons are provided for desktops or devices without an SMS handler.

This follows the editable draft → native SMS pattern inspected in the deployed Hobson app at https://hobson-agent.vercel.app. The suggestions here use grounded templates with recorded lead context, without making an extra AI request or inventing property facts.

Twilio is disabled by default, including existing queued SMS jobs. No Twilio account/key is needed for manual texting. Email acknowledgments to opted-in leads remain available. Facebook leads still enter the same inbox and email notification flow.

Pax can extract and retain multiple areas, min/max price, beds, baths, sale/rent, property type, must-haves, deal-breakers, timeline, moving reason and notes. It shows up to six best sample records per batch, labels unverified requirements, reads the criteria back and asks for confirmation before saving. A later correction changes the draft until confirmed. “Add Lake Worth” appends an area; “bump it to $700K” preserves everything else. The lead page shows the confirmed search separately from current draft/notes.

## Update and run

In the Windows project folder:

```powershell
git pull origin main
npm.cmd ci
npm.cmd run db:migrate
```

No new Prisma migration or dependency is needed for this change. New fields use the existing private conversation JSON and saved-search preferences/status columns.

Open `Open-env.cmd`, preserve your existing keys, and add the new entries from `.env.example`:

```dotenv
PAX_NOTIFICATIONS="email"
PAX_SMS_MODE="manual"
PAX_AGENT_EMAIL="exppbc@gmail.com"
RESEND_API_KEY="YOUR_RESEND_KEY"
RESEND_FROM="Pax <YOUR_VERIFIED_SENDER>"
SUPABASE_URL="https://ztkihbwbkzaugqymsxpy.supabase.co"
SUPABASE_ANON_KEY="YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
PAX_ADMIN_EMAIL="exppbc@gmail.com"
```

Resend must have your sending domain verified. Your Gmail address is the recipient/reply-to; no Gmail password is needed. With `PAX_NOTIFICATIONS="preview"`, local testing records preview deliveries without sending mail. Preview jobs are never resent when live delivery is enabled; use a fresh test visitor.

## Set up your private lead-page sign-in

1. Open your existing Supabase project dashboard.
2. Under **Authentication → Users**, use **Add user → Create new user**. Create `exppbc@gmail.com` with a strong password and confirm the email using the dashboard’s confirmation option. This is a Supabase Auth user; use its password here, **not your Gmail password**. Keep public sign-ups disabled if you do not need them.
3. Copy the project URL and publishable/legacy anon key from the project’s API settings/connect dialog into `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Do not use the service-role key for this login. The app keeps these settings server-side.
4. Restart with `npm.cmd run dev`. Open **http://localhost:3000/admin/leads**, then sign in with the Supabase user above.

Every lead page validates the session server-side with Supabase and checks it belongs to `PAX_ADMIN_EMAIL` with a confirmed email. Public visitors cannot see leads. Sessions expire after at most one hour; sign in again when needed. Sign out on shared devices. Supabase enforces its password-grant limits, plus a small per-process login limit in this app. No registration/password-reset interface or full Phase 4 CRM is added.

For the email link and texting page to work on your phone, `SITE_URL` must be the app’s **HTTPS address reachable from that phone** (your future hosting or a temporary tunnel you configure), not your laptop’s `localhost`. Set the exact address and restart. This task does not deploy the app. Using localhost on the laptop is enough to inspect drafts and test the rest of the flow.

## Try the saved-search conversation

1. Open any page, tap **Ask Pax**, and acknowledge the chat notice.
2. Say: **“I want 3 beds, 2 baths in Delray or Boynton under $650K, pool, no HOA. Moving in 60 days to be closer to work.”**
3. Pax should show available sample records and read your criteria back. The Boynton sample has a documented pool, but HOA status is unknown. Unknown details must be labeled; Pax must not manufacture a third or fourth match if fewer qualify.
4. Ask to save the search and supply your own test contact. Review the confirmation card, choose email permission if wanted, and confirm.
5. Say **“add Lake Worth”**, then **“bump it to $700K.”** Check that beds, baths, pool, HOA, timeline and moving reason survive. The previously confirmed search stays unchanged until you confirm the update. Existing leads can explicitly say **“yes”** after a read-back; first-time capture uses the card.
6. Open the lead from your email alert or `/admin/leads`. Check the complete criteria, Pax’s notes, three editable text drafts and SMS links. No phone number means copy-only drafts.

## Matching alerts

Run a second PowerShell window:

```powershell
npm.cmd run pax:worker
```

Every pass checks confirmed **ACTIVE_SAMPLE** searches against the five-record sample provider. Existing inventory is baselined when the search is confirmed, so current homes are shown immediately in chat but are not falsely announced as newly listed. New qualifying IDs are recorded once. Price edits are not treated as new listings. A corrected, confirmed search establishes a new baseline.

Only **exact verified matches** trigger alerts. Cards may show potential matches with missing facts; alerts never claim those meet unverified requirements. The current five samples do not document HOA status, age restrictions or specific property classes, so those requirements can prevent an exact alert. There are no invented values and no added fictional inventory to make a test look successful.

New matching sample alerts appear on the lead page and are emailed to an opted-in lead when Resend is configured. The message clearly says **fictional sample**, includes property links and a **Stop my alerts** link. Opening that link asks for confirmation; stopping cancels queued matching alerts as well. Manual SMS remains manual. With the fixed five samples, expect no new-listing email unless the sample provider supplies a new matching record. Automated tests inject a test-only new record to verify this path without changing public inventory.

The matching/alert functions accept provider records with optional verified property-type/amenity fields, so an MLS adapter can supply real data later. No MLS API key is used now. Live MLS setup remains a later phase.

## Optional Twilio later

Only when you deliberately want automatic texts, configure the Twilio sender and credentials from `PHASE3-SETUP.md`, then set:

```dotenv
PAX_SMS_MODE="twilio"
PAX_NOTIFICATIONS="both"
```

Restart the app and worker. Both switches are required. Visitor SMS also requires explicit channel permission. Old jobs already suppressed as manual are not resurrected. Manual drafts remain available. Keep the default `manual` setting until you choose to activate Twilio.

## Verification limits

Tests cover native-SMS URL encoding for iOS and Android, editable draft behavior, protected lead pages, criteria extraction through the real AI SDK with a mock model, confirmation/update persistence, exact-match alerts, deduplication and unsubscribe. Browser tests use local fixture authentication with explicit test mode; that path is forbidden in production. Live Supabase Auth, email inbox delivery, and launching your actual phone’s texting app still need your configured accounts/device. No message was sent during implementation.
