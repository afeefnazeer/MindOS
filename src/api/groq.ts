// src/api/groq.ts — Client-side call to /api/chat proxy

export async function callGroq(
  prompt: string,
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: opts.maxTokens ?? 200,
        temperature: opts.temperature ?? 0.3,
      }),
    });

    if (!res.ok) {
      throw new Error(`Groq proxy error: ${res.status}`);
    }

    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch (err) {
    if (import.meta.env.DEV) {
      console.log('Groq API call failed:', err);
    }
    throw err;
  }
}
