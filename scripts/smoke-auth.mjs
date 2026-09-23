import { chromium } from "playwright";
const b = await chromium.launch();
const page = await b.newPage();
const email = `smoke${Date.now()}@test.local`;

// Регистрация
await page.goto("http://127.0.0.1:5199/register");
await page.getByLabel("E-mail").fill(email);
await page.getByLabel("Пароль", { exact: false }).first().fill("password123");
await page.getByLabel("Повторите пароль").fill("password123");
await page.getByRole("button", { name: "Создать" }).click();
await page.waitForURL("http://127.0.0.1:5199/", { timeout: 15000 });
console.log("registered+redirected OK");

// Перезагрузка — сессия жива
await page.reload();
await page.waitForSelector('h1:has-text("Мой улов")', { timeout: 10000 });
console.log("autologin OK");

// Экран записи: 51 вид
await page.goto("http://127.0.0.1:5199/record");
await page.waitForSelector('button[role="option"], [role="listbox"] button', {
  timeout: 15000,
});
const tiles = await page.locator('[role="listbox"] button').count();
console.log("species tiles =", tiles);

// Поиск
await page.getByLabel("Поиск по справочнику").fill("щука");
await page.waitForTimeout(300);
console.log(
  'search "щука" =',
  await page.locator('[role="listbox"] button').count(),
);

// Выход и защита роутов
await page.evaluate(() => localStorage.clear());
await page.goto("http://127.0.0.1:5199/");
await page.waitForURL("**/login", { timeout: 10000 });
console.log("logout->login redirect OK");
await b.close();
