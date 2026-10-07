-- 数据库（SQLite，由 server/db.mjs 自动建表）

-- 兑换码
CREATE TABLE IF NOT EXISTS codes (
  code TEXT PRIMARY KEY,                -- 如 JC-7K3M-Q9TX
  test TEXT NOT NULL,                   -- 测试 id，如 jiucai
  max_uses INTEGER NOT NULL DEFAULT 3,  -- 允许解锁的设备数（换手机、清缓存留余量）
  uses INTEGER NOT NULL DEFAULT 0,
  batch TEXT,                           -- 批次，方便和店铺对账
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  first_used_at TEXT,
  last_used_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_codes_test ON codes (test);

-- 转化漏斗计数：只按天累加次数，不记录任何个人信息
CREATE TABLE IF NOT EXISTS events (
  day TEXT NOT NULL,                    -- 北京时间日期 YYYY-MM-DD
  test TEXT NOT NULL,
  ev TEXT NOT NULL,                     -- view / start / finish / poster / unlock
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, test, ev)
);
