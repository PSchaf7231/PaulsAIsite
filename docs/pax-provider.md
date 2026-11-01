# Pax AI provider

Pax uses one server-side provider layer in `src/server/pax/provider.ts`. It does not configure Hobson.

In Vercel project settings → Environment Variables, add:

- `ANTHROPIC_API_KEY`: your own Anthropic API key (enable API billing in the Anthropic console).
- `AI_PROVIDER`: `anthropic` (optional; this is the default).
- `AI_MODEL`: `claude-haiku-5-5` (optional; this is the Anthropic default).

Select Production, and Preview if you want preview deployments to use it. Redeploy after adding or changing variables. Never put the key in chat, source code, or a NEXT_PUBLIC variable.

To change providers, set `AI_PROVIDER=google` plus `AI_MODEL` to a supported Gemini model and add `GEMINI_API_KEY`; or set `AI_PROVIDER=xai` plus its supported `AI_MODEL` and add `XAI_API_KEY`. No code edit is needed. Only the selected provider's key is used. There is no silent fallback to OpenAI or another provider. Non-Anthropic providers require an explicit model to avoid sending an Anthropic model name to the wrong service.

Before a selected key is installed, Pax reports its AI connection is unconfigured. Listing browsing remains available. Provider selection tests use dummy keys and do not make paid API calls. A real conversational smoke test requires the selected key and billing.
