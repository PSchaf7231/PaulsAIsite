# Search and launch fixes

## Changes

- Homepage and listings typed searches route the original query to Madison's
  server-side website search, which extracts supported filters and returns real
  inventory through the existing MLS service. If the configured language model
  is unavailable, a bounded city/price/bed/bath/feature parser keeps search usable.
  The results page shows the request and interpreted criteria. Unsupported details
  such as a private boat dock are not asserted as verified matches.
- Anam's embedded HTML, persona, endpoint and Start call flow are unchanged.
  Typed website search does not inject text into the separate Anam voice session:
  the published widget exposes notification events but no documented host message
  input. No private SDK state or simulated clicks are used.
- Sort refreshes results immediately. Reset clears all filters, typed request and
  query URL. Initial browsing has no hidden $1M/house/sale defaults.
- For Lease switches to monthly rent options and removes stale sale-price bounds.
  Rental cards retain their monthly asking-price label. The existing inventory
  eligibility rule of residential rents at least $3,500/month remains unchanged.
- Madison's idle card is at the hero's top-right, measured below the header,
  draggable and closable before or during a call. There is one Talk to Madison
  button. Only the host card's layout and controls changed.
- Detail resolution recognizes the trailing MLS ID, including R11140358 and
  ZIP+4/hyphenated ID cases. Provider errors propagate to a retryable error state
  instead of being silently converted into false property-not-found responses.
  Live availability of R11140358 has not been established in this environment.
- Meta initializes once and sends one PageView per public route after analytics
  consent. The public default is Pixel 733196970795080 even without a Vercel
  variable; an explicitly empty variable disables it.

## Validation

87 unit tests passed, TypeScript passed, and the production webpack build passed.
The desktop/mobile browser suite checks typed searches, both sort directions,
Reset, monthly rent options and fixture cards, all displayed sample detail links,
card placement/drag/close, and Pixel initialization/pageviews after consent.
Browser Pixel tests substitute the provider script and do not establish real
Meta receipt. Browser inventory uses samples/fixtures, not the production feed.
Ocean Blvd slug cases are covered with MLS provider fixtures.
The Anam embed HTML and iframe configuration were compared with HEAD and match.

## Vercel action for Paul

No Vercel connector, CLI auth, project binding or VERCEL_TOKEN is available here.
In Vercel open **pauls-a-isite → Settings → Environment Variables** and add:

- Name: `NEXT_PUBLIC_META_PIXEL_ID`
- Value: `733196970795080`
- Environment: **Production**

For Follow Up Boss, generate a fresh key and enter it directly in Vercel:

- Name: `FUB_API_KEY`
- Value: your **new** Follow Up Boss API key
- Environment: **Production**; keep it server-side and mark it Sensitive

No key from a prior chat was reused. Do not commit the fresh key or prefix its
variable with NEXT_PUBLIC_. Save both settings, then open Deployments and redeploy
main (or deploy the new main commit once the variables are saved). Wait for Ready.
GitHub push alone is not proof that Vercel deployed successfully.

## Live verification remains blocked

The public domain is denied by this environment's egress proxy (CONNECT 403;
Chromium ERR_TUNNEL_CONNECTION_FAILED). The new allowed-domain draft preserves
binaries.prisma.sh and adds the website and Meta domains. It needs review/save
and publication through environment settings before this environment can verify
production. This development-environment action does not deploy the website.

After production is Ready and network access permits it, run:

```sh
node scripts/check-live-site.mjs
```

It exercises both typed search entries, sort, Reset and lease choices, checks all
links returned by the production inventory, and observes a real Pixel request
with the expected ID after consent. It flags sample/unavailable inventory and
reports when R11140358 is absent rather than claiming it was verified.
Manual checks should include the Facebook in-app browser and a real Anam call;
those external sessions have not been tested here.
