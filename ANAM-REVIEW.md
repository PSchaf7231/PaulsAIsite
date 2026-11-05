# Madison / real estate site review — November 5, 2026

## Intended experience

Visitors search Palm Beach County MLS homes with filters or plain language, compare cards and map pins, open accurate details/photos, save/share properties, and contact Paul. Madison is intended to be the conversational concierge, with her Gemini brain configured in Anam. Website forms route separately to the site's lead handler. The Anam embed must remain unchanged until a supported integration is agreed.

## What the repository actually connects

- `MadisonBubble` embeds agent `cdb09e97-23af-4628-9df7-f8a270fb8265` with `api-base-url="https://lab.anam.ai"`, using `https://unpkg.com/@anam-ai/agent-widget` without a pinned version.
- The iframe is created when the visitor opens Madison. It grants microphone and autoplay permissions. Closing removes the iframe; reopening mounts a new widget. Anam controls the call startup and internal model configuration.
- The wrapper accepts typed request, listing slug and page-action props, but does not forward them to the iframe. No implemented host messaging bridge gives the voice agent the current MLS result set, current property or saved homes.
- Consequently, buttons such as “Ask Madison about this home” and “Compare to my saved homes” open the voice widget but do not themselves supply that context or request to Anam. A model hosted in Anam may have separately configured tools; those cannot be verified from this repository.
- Website typed search is a separate server path: local filter parsing, with a bounded AI fallback. The server supports Google/Gemini, Anthropic and xAI. This does not prove which brain is selected inside Anam; website provider variables do not configure the embedded Anam agent.
- Earlier README/setup documents contain historical sample-only/Pax/OpenAI instructions. Use LISTING-PERFORMANCE.md for the current inventory release, not those historical descriptions.

## Questions for the Anam appointment

1. Compare the exact same published agent/model/version on Anam and www.pbrealestatepros.com. Is the lab.anam.ai endpoint appropriate for a public production embed? What endpoint and published embed do you recommend?
2. Is the unversioned agent-widget URL recommended for production? Which version is stable, and can it be pinned without changing supported session behavior?
3. Compare two timings separately: click Start call to first video/audio, and end of the visitor's speech to Madison's first audible response. Can Anam show session IDs and a breakdown of speech endpointing, Gemini first-token time, speech generation, and WebRTC transport?
4. Does their demo prewarm or reuse sessions? Our iframe mounts on opening and unmounts on closing. Is supported preloading/session reuse available? What idle and concurrent-session limits apply?
5. Is the srcDoc iframe with microphone/autoplay permissions supported on desktop Chrome and mobile Safari? Are there domain approval, third-party storage, TURN/ICE or regional routing differences on the custom domain?
6. What is the supported way to supply current-property/search context and invoke our server's MLS search? Is this a widget host API, an SDK integration or server tools? Can actions safely update website cards and map pins? Please provide documentation before we modify the embed.
7. Confirm the exact Gemini model, region and configuration for both environments. Is response delay coming from model generation, turn detection or transport? Avoid assuming a faster page alone solves voice latency.

## Suggested comparison

Use the same device, browser, network and prompt on both sites within a few minutes. Record UTC time, agent/session ID, first versus repeat call, time to first video/audio and response delay. Include whether the problem happens before connection, after every spoken turn, or only after closing/reopening. Ask Anam to inspect matching sessions. Do not change the website's embed speculatively.

## Launch priorities and limits

1. Confirm the Vercel deployment is Ready, the snapshot build reports a real MLS count, and the hourly cron is registered. Live production verification is blocked from this Codex environment by outbound network policy.
2. Test real inventory search, sorts, pagination and detail URLs on the public domain; measure actual mobile results timing. Local fixture tests do not establish production speed or MLS completeness.
3. Resolve Anam's current-property/search context bridge before presenting voice-guided search as fully integrated. Existing voice conversation can remain available, but opening the widget alone does not perform an MLS search.
4. Verify favorites survive navigation/reload and that save errors are visible. Code currently depends on activity responses and does not load saved state in the FavoriteButton itself; this deserves a focused authenticated/session test.
5. Resolve the extra Follow Up Boss phone widget in that service's settings. Confirm the displayed number routes to Paul and does not compete with Madison. No FUB settings were changed in this review.
6. Confirm actual CRM/email delivery separately before ads. No test lead or message was sent during this audit.

A follow-up migration restricts direct Supabase browser access to the new snapshot table, matching the existing listing tables. It does not alter Madison.

## Follow-up from Paul: ephemeral sessions and optional registration

Paul shared Anam's explanation that ephemeral sessions allow runtime persona configuration, with a server-side API-key exchange for a short-lived session token. This establishes a possible context-injection path; it does not establish compatibility with the current widget or automatically provide MLS tools or persistent memory. Ask Anam for the supported embed/SDK integration before modifying session startup.

Paul wants browsing without mandatory registration, optional conversational contact capture, and recognition of returning visitors. The website already issues a 30-day HttpOnly first-party `pax_visitor` cookie and supports server-side database conversation storage. This foundation is separate from the Anam iframe and does not currently provide the voice agent with returning-visitor history. An integration would need supported conversation/tool callbacks, server-side identity-to-lead association, and a concise saved-context summary supplied to new voice sessions. An optional verified email sign-in could restore history across devices. Cookies alone identify a browser, not a verified person; shared browsers should not expose sensitive CRM notes. No registration requirement or voice-session changes were added in the map update.
