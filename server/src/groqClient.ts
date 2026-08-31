// Thin wrapper around Groq's OpenAI-compatible chat completions API. Every
// caller treats a null return as "use the rule-based fallback" — this
// function is designed to never throw, so a missing key, network failure,
// timeout, or malformed response degrades gracefully instead of ever
// breaking the request that called it.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';
const TIMEOUT_MS = 6000;

export interface GroqMessage {
  role: 'system' | 'user';
  content: string;
}

/** Calls Groq for a JSON-object completion; returns the parsed object, or null on any failure. */
export async function callGroq(messages: GroqMessage[]): Promise<Record<string, unknown> | null> {
  const apiKey = process.env.SAHAAYA_GROQ_API_KEY;
  if (!apiKey) return null;

  const model = process.env.SAHAAYA_GROQ_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.4,
      }),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
