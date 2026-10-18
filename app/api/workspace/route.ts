import { db, config, json, readJson, sameOrigin, userId } from '@/lib/server';
import { workspaceSchema } from '@/lib/benchmate';
export async function GET() {
  try {
    const id = await userId();
    if (!id) return json({ signedIn: false, ai: false, workspace: null });
    const row = await db().prepare('SELECT payload FROM workspaces WHERE user_id = ?').bind(id).first<{ payload: string }>();
    // A damaged or older record must not replace the current tab with invalid state.
    const workspace = row ? workspaceSchema.parse(JSON.parse(row.payload)) : null;
    const cfg = config();
    return json({ signedIn: true, ai: !!cfg.OPENAI_API_KEY && cfg.AI_ENABLED === 'true', workspace });
  } catch {
    return json({ error: 'Saved workspace is temporarily unavailable. Keep this tab open or export your notes.' }, 503);
  }
}

export async function PUT(req: Request) {
  if (!sameOrigin(req)) return json({ error: 'Invalid request origin' }, 403);
  try {
    const id = await userId();
    if (!id) return json({ error: 'Sign in to save progress' }, 401);
    let payload;
    try { payload = workspaceSchema.parse(await readJson(req, 850000)); }
    catch { return json({ error: 'Invalid workspace data' }, 400); }
    await db().prepare('INSERT INTO workspaces (user_id,payload,updated_at) VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at')
      .bind(id, JSON.stringify(payload), new Date().toISOString()).run();
    return json({ saved: true });
  } catch {
    return json({ error: 'Unable to save. Keep this tab open or export your notes.' }, 503);
  }
}
