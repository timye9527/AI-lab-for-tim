// POST /api/redeem  { code, test }
// Cloudflare Pages Functions + D1（绑定名 DB）。一个码最多在 max_uses 台设备上解锁
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, message: '兑换服务未配置' }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: '请求格式不对' }, 400);
  }
  const code = String(body.code || '').trim().toUpperCase();
  const test = String(body.test || '').trim();
  if (!/^[A-Z0-9-]{6,32}$/.test(code) || !test) return json({ ok: false, message: '兑换码格式不对' }, 400);

  // 原子地占用一次次数，避免并发超用
  const now = new Date().toISOString();
  const upd = await env.DB.prepare(
    'UPDATE codes SET uses = uses + 1, first_used_at = COALESCE(first_used_at, ?1), last_used_at = ?1 WHERE code = ?2 AND test = ?3 AND uses < max_uses',
  )
    .bind(now, code, test)
    .run();
  if (upd.meta?.changes > 0) return json({ ok: true });

  const row = await env.DB.prepare('SELECT uses, max_uses FROM codes WHERE code = ?1 AND test = ?2').bind(code, test).first();
  if (!row) return json({ ok: false, message: '兑换码无效，请检查后再试' }, 404);
  return json({ ok: false, message: '这个兑换码的使用次数已经用完了' }, 409);
}

export const onRequest = () => json({ ok: false, message: 'Method Not Allowed' }, 405);
