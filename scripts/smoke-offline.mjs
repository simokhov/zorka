import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext();
const page = await ctx.newPage();
const email = `off${Date.now()}@test.local`;

await page.goto("http://127.0.0.1:5199/register");
await page.getByLabel("E-mail").fill(email);
await page.getByLabel("Пароль", { exact: false }).first().fill("password123");
await page.getByLabel("Повторите пароль").fill("password123");
await page.getByRole("button", { name: "Создать" }).click();
await page.waitForURL("http://127.0.0.1:5199/", { timeout: 15000 });
console.log("registered OK");

await page.goto("http://127.0.0.1:5199/record");
await page.waitForSelector('[role="listbox"] button', { timeout: 15000 });

// ОФФЛАЙН: сохранить поимку
await ctx.setOffline(true);
await page.getByLabel("Поиск по справочнику").fill("судак");
await page.waitForTimeout(300);
await page.locator('[role="listbox"] button').first().click();
await page.getByRole("button", { name: "Сохранить поимку" }).click();
await page.waitForURL("http://127.0.0.1:5199/", { timeout: 10000 });
await page.waitForSelector("text=Ждёт отправки", { timeout: 8000 });
const tabBadgeOffline = await page
  .locator('a[href="/"] [class*=badgeDot], a[href="/"] [class*=badgeCount]')
  .count();
console.log(
  "offline save OK: card=Ждёт отправки, tabbar counter =",
  tabBadgeOffline,
);

// ОНЛАЙН: досылка — бейдж карточки становится «✓ Синхронизировано», счётчик таб-бара исчезает
await ctx.setOffline(false);
await page.waitForSelector("text=Синхронизировано", { timeout: 20000 });
await page.waitForFunction(
  () => !document.querySelector('a[href="/"] [class*=badgeCount]'),
  { timeout: 10000 },
);
console.log("sync on reconnect OK");

const { createClient } = await import("@supabase/supabase-js");
const SB_URL = process.env.SB_URL ?? "http://127.0.0.1:54321";
const SB_KEY =
  process.env.SB_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const sb = createClient(SB_URL, SB_KEY);
await sb.auth.signInWithPassword({ email, password: "password123" });
const { data } = await sb.from("catches").select("id");
console.log("catches in postgres =", data?.length ?? 0);

// PWA
const sw = await page.evaluate(
  async () => (await navigator.serviceWorker.getRegistrations()).length,
);
const manifest = await page.evaluate(
  async () => (await fetch("/manifest.webmanifest")).ok,
);
console.log("sw registrations =", sw, "| manifest ok =", manifest);

await b.close();
