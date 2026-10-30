# Listing detail improvements

Pull the latest `main` and start the app as usual. No new packages or database migration are needed. Sample mode needs no MLS key; live listings require the Spark setup in [VERCEL-LAUNCH-SETUP.md](VERCEL-LAUNCH-SETUP.md).

## What changed

- **Pax’s take** gives four short points: price/location, size, standout recorded features, and fit with the buyer’s current criteria. It flags mismatches and unknown details. The summary uses actual records and deterministic comparisons rather than an extra AI call. Personal fit loads privately for the current visitor and refreshes after chat changes; it is not shared in public HTML or social previews.
- MLS-style labels become readable words, with details grouped into expandable inside/outdoor/parking sections. Description and location have their own sections. Unknown information is not filled in.
- A small bottom bar opens Pax on the same page. Its four shortcuts prepare a question: nearby, showing, saved-home comparison, or payment. Review and press Send. Existing chat privacy and confirmation controls still apply.
- Photos open in an accessible viewer with previous/next and close controls. Escape closes it.
- Pax can open a section, open photos, or go to the next **actual result in the current search** when asked. It closes the chat panel to reveal the requested content. The conversation stays available. There is no arbitrary URL/script control and no automatic movement on page load or chat reopening.

## Try it

1. Open a home. Read Pax’s take, expand the feature sections and click a photo.
2. Tap a bottom-bar shortcut. Check the prefilled question and press Send after acknowledging the chat notice if this is your first chat.
3. Tell Pax your budget and must-haves. Close Pax and check that its summary describes fit or a mismatch without inventing facts.
4. Search for homes, open one of the results, and ask “Scroll to outdoor living,” “Open photos,” or “Go to the next result.” Pax opens the appropriate page content. At the last result, it tells you there is no next home instead of wrapping around or inventing one.
5. Save another home, then use “Compare to my saved homes.” Pax uses actual saved properties and shows up to three homes in the existing comparison panel.

## Optional voice typing

In a supported browser, choose **Speak to Pax → Start microphone** and grant your browser microphone permission. Say a request such as “Open photos.” Review the transcript and press Send. The same page-control tools handle typed and dictated requests.

The browser may use its own speech service; the app does not record/store audio. Closing Pax or sending a message stops recognition. Unsupported browsers retain normal text input. Browser speech support, microphone permissions, and network availability vary; test on your actual phone or Windows browser. Use HTTPS on a hosted site (localhost works for local testing). No Vapi key or voice-call service is required. Full Vapi voice conversations remain a later phase.

## Availability and missing information

Without a Spark token, all five fallback homes remain fictional and cannot be toured. With a valid token, details come from the active IDX feed. A showing shortcut is an inquiry, not a confirmed showing; Paul confirms the home and time. No nearby-places or school-assignment feed is connected, so specific distances and travel times need Paul’s confirmation. Payment estimates require explicit assumptions and do not represent loan approval.
