// Дизайн-проба переполнений: /dev/gallery (vite preview) + design/zorka-ui.html (file://).
// Запуск: node scripts/design-probe.mjs
// Exit code 1 — найдены переполнения.
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 4273;
const viewport = { width: 390, height: 844 };
const reportLines = [];
let violations = 0;

function log(line = "") {
  reportLines.push(line);
  console.log(line);
}

function freePort(candidate) {
  return new Promise((resolve) => {
    const srv = createServer();
    srv.once("error", () => resolve(freePort(candidate + 1)));
    srv.listen(candidate, () => srv.close(() => resolve(candidate)));
  });
}

async function startPreview() {
  const finalPort = await freePort(port);
  const child = spawn(
    "pnpm",
    ["preview", "--port", String(finalPort), "--strictPort"],
    {
      cwd: root,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout.on("data", () => {});
  child.stderr.on("data", (d) => process.stderr.write(d));
  const base = `http://localhost:${finalPort}`;
  for (let i = 0; i < 120; i++) {
    try {
      const res = await fetch(base);
      if (res.ok) return { child, base };
    } catch {
      /* not ready */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  child.kill();
  throw new Error("vite preview не поднялся");
}

// Проверка одного документа на переполнения в мобильном viewport.
async function probePage(page, label, url) {
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(300); // шрифты/отрисовка

  const result = await page.evaluate(
    ({ vw, vh }) => {
      const fixedLike = (el) => {
        for (let n = el; n && n instanceof Element; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (cs.position === "fixed" || cs.position === "sticky") return true;
        }
        return false;
      };
      const out = { pageOverflow: null, offscreen: [], hScroll: [] };
      const doc = document.documentElement;
      out.pageOverflow = {
        scrollWidth: doc.scrollWidth,
        clientWidth: doc.clientWidth,
        bodyScrollWidth: document.body
          ? document.body.scrollWidth
          : doc.scrollWidth,
      };
      for (const el of document.body.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        const isFixed = fixedLike(el);
        // a) горизонтальное переполнение страницы
        if (!isFixed && r.right > vw + 1) {
          out.offscreen.push(
            `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(/\s+/).slice(0, 2).join(".") : ""} right=${Math.round(r.right)} > ${vw}`,
          );
        }
        // b) элемент сам прокручивается по горизонтали
        if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
          const cs = getComputedStyle(el);
          if (cs.overflowX === "auto" || cs.overflowX === "scroll") {
            out.hScroll.push(
              `${el.tagName.toLowerCase()}${typeof el.className === "string" && el.className ? "." + el.className.split(/\s+/).slice(0, 2).join(".") : ""} scrollWidth=${el.scrollWidth} clientWidth=${el.clientWidth}`,
            );
          }
        }
      }
      return out;
    },
    { vw: viewport.width, vh: viewport.height },
  );

  const pageHOverflow =
    result.pageOverflow.scrollWidth > result.pageOverflow.clientWidth + 1 ||
    result.pageOverflow.bodyScrollWidth > result.pageOverflow.clientWidth + 1;

  log(`\n=== ${label} ===`);
  log(`url: ${url}`);
  log(
    `page scrollWidth=${Math.max(result.pageOverflow.scrollWidth, result.pageOverflow.bodyScrollWidth)} clientWidth=${result.pageOverflow.clientWidth} → ${pageHOverflow ? "ПЕРЕПОЛНЕНИЕ" : "ok"}`,
  );
  if (pageHOverflow) {
    violations++;
    log("  ! горизонтальное переполнение страницы");
  }
  const offscreen = result.offscreen.filter(
    (l) => !l.startsWith("html") && !l.startsWith("body"),
  );
  if (offscreen.length) {
    log(`  элементы за правым краем viewport: ${offscreen.length}`);
    for (const l of offscreen.slice(0, 20)) log(`    - ${l}`);
  }
  violations += offscreen.length;
  if (result.hScroll.length) {
    log(`  элементы с горизонтальным скроллом: ${result.hScroll.length}`);
    for (const l of result.hScroll.slice(0, 10)) log(`    - ${l}`);
  }
  return pageHOverflow || offscreen.length > 0;
}

async function main() {
  if (!existsSync(path.join(root, "dist", "index.html"))) {
    log("dist/ не найден — сначала `pnpm build`.");
    process.exit(2);
  }
  const preview = await startPreview();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });
  let bad = false;
  try {
    bad = await probePage(
      page,
      "Галерея компонентов (/dev/gallery)",
      `${preview.base}/dev/gallery`,
    );
    const mockupPath = path.join(root, "design", "zorka-ui.html");
    if (existsSync(mockupPath)) {
      bad =
        (await probePage(
          page,
          "Макет (design/zorka-ui.html)",
          pathToFileURL(mockupPath).href,
        )) || bad;
    } else {
      log("\nМакет design/zorka-ui.html не найден — сверка только с галереей.");
    }
  } finally {
    await browser.close();
    preview.child.kill();
  }
  log(`\nИтого нарушений: ${violations} → exit ${bad ? 1 : 0}`);
  process.exit(bad ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
