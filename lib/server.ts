import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export function db() { if(!env.DB) throw new Error('Storage is unavailable'); return env.DB; }
export const config = () => env as unknown as { OPENAI_API_KEY?: string; OPENAI_MODEL?: string; AI_ENABLED?: string };
export async function userId() { return (await getChatGPTUser())?.userId ?? null; }
export function json(data: unknown, status=200) { return Response.json(data,{status,headers:{'Cache-Control':'no-store'}}); }
export function sameOrigin(req:Request){const origin=req.headers.get('origin');return !!origin && origin===new URL(req.url).origin;}
export async function readJson(req: Request, limit: number) {
  const reader = req.body?.getReader();
  if (!reader) throw Error('Missing body');
  try {
    let size = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw Error('Request too large');
      }
      chunks.push(value);
    }
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder().decode(body));
  } finally {
    reader.releaseLock();
  }
}
