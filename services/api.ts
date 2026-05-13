const API_BASE_URL = 'https://tamil-chat-api.onrender.com';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function sendMessage(
  messages: { role: string; content: string }[],
  provider: string = 'gemini',
  onChunk?: (text: string) => void
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(`${API_BASE_URL}/api/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, provider }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    let fullText = '';

    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      try {
        const data = JSON.parse(trimmed.slice(6));
        if (data.error) throw new Error(data.error);
        if (data.content) {
          fullText += data.content;
          onChunk?.(data.content);
        }
      } catch (e: any) {
        if (e.message && !e.message.startsWith('JSON')) throw e;
      }
    }

    return fullText || 'பதில் இல்லை';
  } finally {
    clearTimeout(timer);
  }
}

export async function getProviders(): Promise<string[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chat/providers`);
    const data = await res.json();
    return data?.providers?.map((p: any) => p.id) || ['gemini'];
  } catch {
    return ['gemini'];
  }
}