import { env } from '../../config/env.js';

/**
 * Single LLM provider wrapper so the model can be swapped from one place.
 * Default: Groq (OpenAI-compatible chat completions). To switch providers,
 * change this file only — the rest of the app calls `chatJSON`.
 */

const PROVIDERS = {
  groq: {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    apiKey: () => env.groqApiKey,
    model: () => env.groqModel,
  },
};

const provider = PROVIDERS[env.aiProvider] || PROVIDERS.groq;

export const isAIConfigured = () => Boolean(provider.apiKey());

/** Low-level chat call. Returns the assistant message string. */
async function chat(messages, { temperature = 0.4, jsonMode = true } = {}) {
  const res = await fetch(provider.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey()}`,
    },
    body: JSON.stringify({
      model: provider.model(),
      messages,
      temperature,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`AI provider error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/** Parse JSON defensively — handles stray prose / code fences around the object. */
function safeParseJSON(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    /* fall through to extraction */
  }
  const cleaned = str.replace(/```json/gi, '').replace(/```/g, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      /* give up */
    }
  }
  return null;
}

/**
 * Ask the model for JSON and return a validated object.
 * Retries with a repair prompt if parsing or `validate` fails.
 *
 * @param {object} o
 * @param {string} o.system  system prompt
 * @param {string} o.user    user prompt
 * @param {(obj:any)=>boolean} [o.validate]  structure check
 * @param {number} [o.temperature]
 * @param {number} [o.maxAttempts]
 */
export async function chatJSON({ system, user, validate, temperature = 0.4, maxAttempts = 3 }) {
  let messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let content;
    try {
      content = await chat(messages, { temperature, jsonMode: true });
    } catch (err) {
      lastError = err;
      continue; // network / API error → retry
    }

    const parsed = safeParseJSON(content);
    if (parsed && (!validate || validate(parsed))) {
      return parsed;
    }

    lastError = new Error('AI returned JSON that did not match the required schema.');
    // Repair turn: show the bad output and ask for a corrected JSON-only reply.
    messages = [
      { role: 'system', content: system },
      { role: 'user', content: user },
      { role: 'assistant', content: content || '' },
      {
        role: 'user',
        content:
          'Your previous response was not valid for the required JSON schema. ' +
          'Respond again with ONLY the corrected JSON object — no markdown, no explanation.',
      },
    ];
  }

  throw lastError || new Error('AI failed to produce valid JSON.');
}
