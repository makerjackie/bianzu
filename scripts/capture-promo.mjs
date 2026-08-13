import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.PROMO_URL || "http://127.0.0.1:5173";

async function shoot(lang, who, dir) {
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch({
    channel: "chrome",
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}/?who=${who}&lang=${lang}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${dir}/00-start.png` });
  for (let i = 0; i < 6; i += 1) {
    await page.evaluate((index) => window.__bianzu.setT(index / 5, true), i);
    await page.waitForTimeout(280);
    await page.screenshot({ path: `${dir}/${String(i + 1).padStart(2, "0")}-rank.png` });
  }
  if (who === "liang") {
    await page.evaluate(() => window.__bianzu.setSubject("claude"));
    await page.waitForTimeout(350);
    await page.evaluate(() => window.__bianzu.setT(1, true));
    await page.waitForTimeout(280);
    await page.screenshot({ path: `${dir}/07-claude.png` });
  } else {
    await page.evaluate(() => window.__bianzu.setSubject("claude"));
    await page.waitForTimeout(350);
    await page.evaluate(() => window.__bianzu.setT(1, true));
    await page.waitForTimeout(280);
    await page.screenshot({ path: `${dir}/07-claude.png` });
  }
  await browser.close();
}

await shoot("zh", "liang", "video/frames-zh");
await shoot("en", "musk", "video/frames-en");
console.log("frames ready");
