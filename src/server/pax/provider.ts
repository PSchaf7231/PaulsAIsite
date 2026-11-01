import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogle } from '@ai-sdk/google';
import { createXai } from '@ai-sdk/xai';

type Provider = 'anthropic' | 'google' | 'xai';
const keyNames = { anthropic: 'ANTHROPIC_API_KEY', google: 'GEMINI_API_KEY', xai: 'XAI_API_KEY' } as const;

// Server-only consumer: never return this configuration (which contains a key) to clients.
export function paxProviderConfig(env: Record<string, string | undefined> = process.env) {
  const provider = (env.AI_PROVIDER?.trim().toLowerCase() || 'anthropic') as Provider;
  if (!Object.hasOwn(keyNames, provider)) throw new Error('AI_PROVIDER must be anthropic, google, or xai.');
  const model = env.AI_MODEL?.trim() || (provider === 'anthropic' ? 'claude-haiku-5-5' : '');
  if (!model) throw new Error('Set AI_MODEL for the selected Pax provider.');
  const apiKey = env[keyNames[provider]]?.trim();
  if (!apiKey) throw new Error(`Pax is not configured. Set ${keyNames[provider]}.`);
  return { provider, model, apiKey };
}

export function paxConfigured() {
  try { paxProviderConfig(); return true; } catch { return false; }
}

export function createPaxModel() {
  const { provider, model, apiKey } = paxProviderConfig();
  switch (provider) {
    case 'anthropic': return createAnthropic({ apiKey })(model);
    case 'google': return createGoogle({ apiKey })(model);
    case 'xai': return createXai({ apiKey })(model);
  }
}
