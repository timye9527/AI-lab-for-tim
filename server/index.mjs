// 生产服务：静态页面 + /api/redeem + /api/event
// 用法：node server/index.mjs     环境变量：PORT（默认 8788）、HOST（默认 127.0.0.1）、DB_PATH
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { openDb, redeem, track } from './db.mjs';

const root = new URL('../public/', import.meta.url).pathname;
const port = Number(process.env.PORT) || 8788;
const host = process.env.HOST || '127.0.0.1';
const db = openDb();

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

// 兑换接口简单限流：每个 IP 10 分钟最多 30 次
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 10000) hits.clear();
  return list.length > 30;
}

const send = (res, status, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
};

async function readBody(req, max = 4096) {
  let data = '';
  for await (const chunk of req) {
    data += chunk;
    if (data.length > max) throw new Error('too large');
  }
  return JSON.parse(data || '{}');
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  try {
    if (url.pathname === '/api/redeem') {
      if (req.method !== 'POST') return send(res, 405, { ok: false });
      if (limited(ip)) return send(res, 429, { ok: false, message: '尝试太频繁，请稍后再试' });
      const body = await readBody(req);
      const [status, data] = redeem(db, body.code, body.test);
      return send(res, status, data);
    }
    if (url.pathname === '/api/event') {
      if (req.method !== 'POST') return send(res, 405, { ok: false });
      const body = await readBody(req, 512);
      track(db, String(body.test || ''), String(body.ev || ''));
      return send(res, 204, '');
    }
    if (url.pathname === '/healthz') return send(res, 200, 'ok', 'text/plain');
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method Not Allowed', 'text/plain');

    // 静态文件
    let path = normalize(decodeURIComponent(url.pathname));
    if (path.endsWith('/')) path += 'index.html';
    let file = join(root, path);
    if (!file.startsWith(root)) return send(res, 403, 'Forbidden', 'text/plain');
    let s = await stat(file).catch(() => null);
    // /jiucai 这种不带斜杠的目录，跳到带斜杠的地址
    if (s?.isDirectory()) {
      res.writeHead(301, { location: url.pathname + '/' + url.search });
      return res.end();
    }
    if (!s) return send(res, 404, 'Not found', 'text/plain');
    const ext = extname(file);
    res.writeHead(200, {
      'content-type': TYPES[ext] || 'application/octet-stream',
      // html 不缓存，改完内容用户立刻看到；其余缓存 5 分钟
      'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=300',
    });
    if (req.method === 'HEAD') return res.end();
    res.end(await readFile(file));
  } catch (err) {
    console.error(err);
    if (!res.headersSent) send(res, 400, { ok: false, message: '请求有误' });
  }
}).listen(port, host, () => console.log(`服务已启动：http://${host}:${port}`));
