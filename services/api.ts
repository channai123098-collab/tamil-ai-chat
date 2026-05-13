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
  imageUrl?: string;
  imageLoading?: boolean;
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

export async function generateImage(params: {
  imgFace?: string;
  imgBody?: string;
  imgAttire?: string;
  imagePrompt?: string;
  personaName?: string;
  mode?: 'single' | 'together';
}): Promise<{ b64_json: string; mimeType: string }> {
  const startRes = await fetch(`${API_BASE_URL}/api/image/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'stablehorde',
      mode: params.mode ?? 'single',
      imgFace: params.imgFace,
      imgBody: params.imgBody,
      imgAttire: params.imgAttire,
      imagePrompt: params.imagePrompt,
      personaName: params.personaName,
      apiKeys: { stablehorde: '0000000000' },
    }),
  });

  if (!startRes.ok) throw new Error(`Start failed: ${startRes.status}`);
  const { jobId } = await startRes.json() as { jobId: string };
  if (!jobId) throw new Error('No job ID received from server');

  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      const pollRes = await fetch(`${API_BASE_URL}/api/image/status/${jobId}`);
      if (!pollRes.ok) continue;
      const data = await pollRes.json() as any;
      if (data.status === 'done' && data.result) {
        return data.result as { b64_json: string; mimeType: string };
      }
      if (data.status === 'error') {
        throw new Error(data.userMessage || data.error || 'Image generation failed');
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch')) throw e;
    }
  }
  throw new Error('⏱ Timeout — Stable Horde queue மிகவும் long. மீண்டும் try பண்ணுங்க.');
}

export async function listCloudinaryImages(
  folder: string,
): Promise<{ url: string; public_id: string }[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/image/cloudinary-list?folder=${encodeURIComponent(folder)}`,
      { signal: controller.signal },
    );
    if (!res.ok) {
      const err = await res.json() as any;
      throw new Error(err?.error || `List failed: ${res.status}`);
    }
    const data = await res.json() as any;
    return data.images || [];
  } finally {
    clearTimeout(timer);
  }
}

export async function uploadToCloudinary(
  b64_json: string,
  mimeType: string = 'image/jpeg',
  folder: string = 'tamil-ai-chat',
): Promise<{ url: string; public_id: string; width?: number; height?: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 40000);
  try {
    const res = await fetch(`${API_BASE_URL}/api/image/cloudinary-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ b64_json, mimeType, folder }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const err = await res.json() as any;
      throw new Error(err?.error || `Upload failed: ${res.status}`);
    }
    return await res.json() as any;
  } finally {
    clearTimeout(timer);
  }
}
