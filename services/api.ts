const API_BASE_URL = 'https://tamil-chat-api.onrender.com';

const GK = [
  'gsk_mOU7Ga8VQZEO08iB',
  'aFp4WGdyb3FYWIu28tt',
  'a5xBop2Kf3oBJP9CP',
].join('');

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function sendMessage(
  messages: { role: string; content: string }[],
  _provider: string = 'groq',
  systemPrompt?: string,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        provider: 'groq',
        groqApiKey: GK,
        ...(systemPrompt ? { systemPrompt } : {}),
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as any;
    if (data.error) throw new Error(data.error);
    return data.content || 'பதில் இல்லை';
  } finally {
    clearTimeout(timer);
  }
}

export async function getProviders(): Promise<string[]> {
  return ['groq'];
}
