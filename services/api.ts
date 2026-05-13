import axios from 'axios';

const API_BASE_URL = 'https://tamil-chat-api.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export async function sendMessage(
  messages: { role: string; content: string }[],
  provider: string = 'gemini'
): Promise<string> {
  const res = await api.post('/api/chat', { messages, provider });
  return res.data?.message?.content || res.data?.content || 'பதில் இல்லை';
}

export async function getProviders(): Promise<string[]> {
  try {
    const res = await api.get('/api/chat/providers');
    return res.data?.providers || ['gemini'];
  } catch {
    return ['gemini'];
  }
}