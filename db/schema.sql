-- 兑换码表（Cloudflare D1 / SQLite）
CREATE TABLE IF NOT EXISTS codes (
  code TEXT PRIMARY KEY,           -- 如 JC-7K3M-Q9TX
  test TEXT NOT NULL,              -- 测试 id，如 jiucai
  max_uses INTEGER NOT NULL DEFAULT 3,  -- 允许解锁的设备数（换手机、清缓存留余量）
  uses INTEGER NOT NULL DEFAULT 0,
  batch TEXT,                      -- 批次，方便对账
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  first_used_at TEXT,
  last_used_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_codes_test ON codes (test);
