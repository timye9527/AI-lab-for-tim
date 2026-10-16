// 无头 Chromium：优先用环境变量 CHROME，其次用预装的 Playwright 浏览器
import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
const PRESET = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export function launch() {
  const executablePath = process.env.CHROME || (existsSync(PRESET) ? PRESET : undefined);
  return chromium.launch({ executablePath, args: ['--disable-gpu'] });
}
