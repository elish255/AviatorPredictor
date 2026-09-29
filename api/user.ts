import { json, supabaseFirst, type VercelRequest, type VercelResponse } from '../src/lib/server';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = Number(req.query?.id ?? 0);
  if (!id) return json(res, { success: false, message: 'User hayupo.' }, 400);
  try {
    const user = await supabaseFirst('aviator_users', { id: `eq.${id}` });
    if (!user) return json(res, { success: false, message: 'User hayupo.' }, 404);
    return json(res, { success: true, user });
  } catch { return json(res, { success: false, message: 'Database error.' }, 500); }
}
