# SEO and Google setup

The homepage has a small Neighborhood guides link near the bottom. Eight neighborhood pages have local draft copy, schools/beach/downtown/HOA/55+ guidance, relevant sample listings, FAQs and an in-place Pax button. Paul must review the copy. None claims verified school assignments, HOA status or live availability.

Every public content page has a title, description, canonical URL and social sharing image. Agent, listing and FAQ structured data describes the visible content. Structured data does not guarantee a Google rich result. Sample listing pages are always noindex and do not advertise fictional prices as real offers. Draft neighborhood pages stay noindex and out of the sitemap until reviewed.

## Before inviting Google

1. Set `SITE_URL` to your actual public HTTPS website address in your hosting environment, without a trailing slash. Do not use localhost for Google or phone links.
2. Review the eight pages under `/communities`. After approving each, add its slug to `reviewedCommunitySlugs` in `src/lib/communities.ts` (for example `delray-beach`). This removes that page’s draft label and allows indexing when the whole site is ready.
3. Keep `SEO_INDEXING_ENABLED=false` during testing. When you approve public launch, set it to `true` and rebuild/redeploy. This enables crawling and the public sitemap. Draft guides and fictional sample listings remain excluded. No public launch is performed by this code change.

## Google Search Console

1. Go to https://search.google.com/search-console and choose **Add property → Domain**. Enter your actual domain.
2. Copy Google’s TXT verification record into the DNS settings at your domain provider. Return to Google and click Verify. Domain verification does not need an app key.
3. Alternatively, choose a URL-prefix property and HTML tag verification. Put only the tag’s `content` value into `GOOGLE_SITE_VERIFICATION`, then rebuild/redeploy and verify.
4. After indexing is enabled, open **Sitemaps** in Search Console and submit `sitemap.xml` for your public site.
5. Use **URL inspection → Test live URL** on the homepage and each approved neighborhood page. Request indexing. Google decides whether and when to index; no ranking or indexing date is guaranteed.
6. Check Pages, Core Web Vitals and search performance after Google has collected data. Review draft copy and property data before making further pages indexable.

## Google Analytics 4

1. At https://analytics.google.com create a GA4 property and **Web data stream** using your public domain.
2. Copy the Measurement ID beginning `G-` into `NEXT_PUBLIC_GA_MEASUREMENT_ID` in the hosting environment. This is a public identifier, not a password. Rebuild/redeploy because Next.js embeds public environment values at build time.
3. In that web stream, turn **Enhanced measurement off**. The app sends its own page views; this avoids duplicate page views and automatic forms/site-search tracking. Do not add a separate Analytics or Tag Manager snippet.
4. Visit the site and choose **Allow site analytics** near the footer. Then check Analytics Realtime for your visit. Nothing loads from Google until the visitor opts in. The footer lets them turn analytics off later.
5. The app sends clean public page paths and loading/interactivity/layout metrics, not chat text or lead details. Private lead pages and unsubscribe pages are excluded. Keep Google signals and ad personalization off unless separately reviewed and intentionally implemented.

## Trying the changes

- Open a listing, scroll, and tap Ask Pax about this home. The same page stays behind a desktop side panel or phone slide-up sheet. Close it to return to the same position. Reopen and continue the same chat.
- Open another listing from a Pax result. Pax closes for navigation; reopening shows the new home name and your existing conversation. Existing `/pax` bookmarks redirect to the homepage with the panel open.
- Visit `/communities` and check all eight drafts. Each has sample matches (or an honest empty result) and an in-place chat button.
- Share a public page URL to test its title and branded image. Facebook may cache older previews; its Sharing Debugger can refresh them.
- Responsive optimized photos, lazy loading, a smaller local WebP hero and chat loaded on demand reduce initial work. Use PageSpeed Insights on the deployed site and Search Console for real Core Web Vitals. Local automated tests cannot certify real-user performance.

For email alerts, private lead pages, three manual text suggestions, and saved-search setup, see [MANUAL-TEXTING-AND-SEARCHES.md](MANUAL-TEXTING-AND-SEARCHES.md).

## Pax result controls

On desktop, the in-page panel has chat on the left and cards/map on the right. On phones, results form an expandable slide-up section beneath the conversation. Close Pax to return to the exact page position.

- Chips beneath the conversation show the current location, budget, beds/baths and feature filters. Tap × to remove one; saved alerts are only changed after you confirm updated criteria.
- Cards are numbered. Say “tell me about number 3” and Pax uses that exact displayed record. Numbering remains stable while asking for details or loading another batch; a new search starts new numbering.
- Save a home, compare up to three homes side by side, or tap the pin to open that home on the map.
- **Create alert** reads the criteria back, asks for contact if needed, and asks for confirmation. Email delivery also requires email permission and the configured worker.
- Results load six at a time; **Show me more** appears only when another matching batch exists. There are still just five public sample listings, so the current dataset cannot fill a second page. Automated tests verify paging with separate test-only data.
- Pax handles small talk warmly and asks one natural must-have question before a broad search. If you already gave must-haves or say “just show me,” it searches without making you repeat yourself.
- Voice is still a later phase. Numbered-result tools are reusable by the future voice connection; no microphone or Vapi service was added.
