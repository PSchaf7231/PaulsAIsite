# Pax AI provider

Pax uses one server-side provider layer in `src/server/pax/provider.ts`. It does not configure Hobson.

In Vercel project settings → Environment Variables, add:

- `ANTHROPIC_API_KEY`: your own Anthropic API key (enable API billing in the Anthropic console).
- `AI_PROVIDER`: `anthropic` (optional; this is the default).
- `AI_MODEL`: `claude-haiku-5-5` (optional; this is the Anthropic default).

Select Production, and Preview if you want preview deployments to use it. Redeploy after adding or changing variables. Never put the key in chat, source code, or a NEXT_PUBLIC variable.

To change providers, set `AI_PROVIDER=google` plus `AI_MODEL` to a supported Gemini model and add `GEMINI_API_KEY`; or set `AI_PROVIDER=xai` plus its supported `AI_MODEL` and add `XAI_API_KEY`. No code edit is needed. Only the selected provider's key is used. There is no silent fallback to OpenAI or another provider. Non-Anthropic providers require an explicit model to avoid sending an Anthropic model name to the wrong service.

Before a selected key is installed, Pax reports its AI connection is unconfigured. Listing browsing remains available. Provider selection tests use dummy keys and do not make paid API calls. A real conversational smoke test requires the selected key and billing.

## Madison video

The public floating panel uses Anam's `CUSTOMER_CLIENT_V1` custom-LLM mode. Anam handles microphone transcription, speech and video; every conversational turn goes through the existing `/api/pax/chat` route, provider layer, buyer tools, stored Pax session and confirmation controls. Hobson is not involved. The avatar ID is `cdb09e97-23af-4628-9df7-f8a270fb8265`.

`ANAM_API_KEY` stays on the server; only a short-lived session token reaches the browser. Optional `ANAM_VOICE_ID` overrides Anam's documented default voice. Sessions require a same-origin request, explicit consent, an available Pax provider and durable conversation storage. Starts are limited to six per conversation per hour with a 30-second interval; each video session ends after five minutes. No avatar SDK, microphone request or video session starts just by visiting/opening the page. Minimize pauses the microphone; Close/End video/unmount stop it. The layout retains the panel and conversation through public-page navigation.

Production also needs `DATABASE_URL` with the repository's Prisma migrations applied. A live notification smoke test needs `RESEND_API_KEY`, a verified `RESEND_FROM`, and `PAX_AGENT_EMAIL` (Paul's recipient address). Missing settings are not treated as a successful delivery. Browser tests use explicit test mode or mocked failures; they do not certify live WebRTC or email delivery.
