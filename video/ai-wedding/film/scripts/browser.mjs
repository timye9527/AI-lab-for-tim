// 无头 Chromium：优先环境变量 CHROME，其次预装的浏览器
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const PRESET = '/opt/pw-browsers/chromium';
export function launch() {
  const executablePath = process.env.CHROME || (existsSync(PRESET) ? PRESET : undefined);
  return chromium.launch({ executablePath, args: ['--disable-gpu', '--no-sandbox'] });
}
