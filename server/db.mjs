// SQLite 连接 + 业务逻辑（兑换、计数、生成码），服务和管理脚本共用
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomInt } from 'node:crypto';

export const EVENTS = ['view', 'start', 'finish', 'poster', 'unlock'];

export function openDb(path = process.env.DB_PATH || 'data/app.db') {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec(readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  return db;
}

// 北京时间的日期，统计按这个分天
export function today() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
}

// 兑换：成功返回 200，码不存在 404，次数用完 409
export function redeem(db, rawCode, rawTest) {
  const code = String(rawCode || '').trim().toUpperCase();
  const test = String(rawTest || '').trim();
  if (!/^[A-Z0-9-]{6,32}$/.test(code) || !test) return [400, { ok: false, message: '兑换码格式不对' }];
  const now = new Date().toISOString();
  // 原子地占用一次次数，避免并发超用
  const r = db
    .prepare('UPDATE codes SET uses = uses + 1, first_used_at = COALESCE(first_used_at, ?), last_used_at = ? WHERE code = ? AND test = ? AND uses < max_uses')
    .run(now, now, code, test);
  if (r.changes > 0) return [200, { ok: true }];
  const row = db.prepare('SELECT uses, max_uses FROM codes WHERE code = ? AND test = ?').get(code, test);
  if (!row) return [404, { ok: false, message: '兑换码无效，请检查后再试' }];
  return [409, { ok: false, message: '这个兑换码的使用次数已经用完了，请联系客服' }];
}

export function track(db, test, ev) {
  if (!EVENTS.includes(ev) || !/^[a-z0-9-]{1,32}$/.test(test)) return false;
  db.prepare('INSERT INTO events (day, test, ev, n) VALUES (?, ?, ?, 1) ON CONFLICT (day, test, ev) DO UPDATE SET n = n + 1').run(today(), test, ev);
  return true;
}

// 去掉 0/O/1/I/L 这类容易看错的字符
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const part = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

export function makeCodes(count, prefix) {
  const codes = new Set();
  while (codes.size < count) codes.add(`${prefix}-${part()}-${part()}`);
  return [...codes];
}

export function insertCodes(db, codes, test, maxUses, batch) {
  const st = db.prepare('INSERT OR IGNORE INTO codes (code, test, max_uses, batch) VALUES (?, ?, ?, ?)');
  let n = 0;
  db.exec('BEGIN');
  try {
    for (const c of codes) n += Number(st.run(c.trim().toUpperCase(), test, maxUses, batch).changes);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  return n;
}
