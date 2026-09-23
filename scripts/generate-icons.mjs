// Генератор иконок «Зорьки» из векторного знака design/brand/zorka-mark.svg.
// Запуск: node scripts/generate-icons.mjs (или pnpm icons)
// Рендер PNG — Playwright/Chromium + пиксельная проверка результата.
import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = path.join(root, "public", "icons");
const brandDir = path.join(root, "design", "brand");
const markPath = path.join(brandDir, "zorka-mark.svg");

// Палитра — токены из docs/06-design-system.md (менять только вместе с ней).
const C = {
  plate: "#EBF3F5", // --color-bg: подложка иконки
  plateEdge: "#E0E8E7", // --color-surface-alt: мягкий край
};

// Знак занимает 512×512; его полезная высота — от кончика пламени (y=42)
// до низа круга (y=470). Обрезаем пустые поля, чтобы управлять масштабом.
const MARK_CROP = { x: 95, y: 42, w: 320, h: 428 };

function plate(size, radius) {
  return `<rect width="${size}" height="${size}" rx="${radius}" fill="url(#plate)"/>`;
}

// Композиция иконки: подложка + знак, вписанный с заданным полем.
// Знак масштабируется по наибольшей стороне, поэтому целиком помещается в квадрат.
// dyShift — оптическая поправка: знак вытянут вверх (языки пламени), поэтому
// без сдвига вниз он кажется прижатым к верхнему краю плитки.
function compose({ size, radius = 0, scale = 1, dyShift = 0, body }) {
  const s = size * scale;
  const k = s / Math.max(MARK_CROP.w, MARK_CROP.h);
  const dx = (size - MARK_CROP.w * k) / 2;
  const dy = (size - MARK_CROP.h * k) / 2 + size * dyShift;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F4F9FA"/>
      <stop offset="1" stop-color="${C.plate}"/>
    </linearGradient>
  </defs>
  ${plate(size, radius)}
  <g transform="translate(${dx} ${dy}) scale(${k}) translate(${-MARK_CROP.x} ${-MARK_CROP.y})">
    ${body}
  </g>
</svg>`;
}

async function renderPng(browser, svg, size, file, transparent) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<!doctype html><style>html,body{margin:0;padding:0;background:transparent}</style>${svg}`,
  );
  const buf = await page.screenshot({
    clip: { x: 0, y: 0, width: size, height: size },
    ...(transparent ? { omitBackground: true } : {}),
  });
  await page.close();
  await writeFile(file, buf);
}

// Пиксельная проверка: янтарное пламя сверху, тиловая вода снизу,
// светлая подложка, прозрачные углы у скруглённой версии.
async function verifyPng(browser, file, { transparentCorners }) {
  const page = await browser.newPage({ viewport: { width: 64, height: 64 } });
  const b64 = (await readFile(file)).toString("base64");
  const res = await page.evaluate(
    async ({ url, transparentCorners }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${url}`;
      await img.decode();
      const { width: w, height: h } = img;
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const px = (x, y) => ctx.getImageData(x, y, 1, 1).data;
      const out = { w, h, errors: [] };
      const isAmber = (d) =>
        d[0] > 225 && d[1] > 170 && d[1] < 225 && d[2] < 170;
      const isTeal = (d) =>
        d[0] < 70 && d[1] > 95 && d[1] < 145 && d[2] > 95 && d[2] < 145;
      // пламя: точка в верхней трети по центру
      const flame = px(Math.round(w / 2), Math.round(h * 0.3));
      if (!isAmber(flame))
        out.errors.push(`нет янтарного пламени: rgba(${flame})`);
      // вода: точка в нижней трети по центру
      let hasTeal = false;
      for (let y = Math.round(h * 0.66); y < Math.round(h * 0.82); y++) {
        if (isTeal(px(Math.round(w / 2), y))) hasTeal = true;
      }
      if (!hasTeal) out.errors.push("нет тиловой воды в ожидаемой зоне");
      if (transparentCorners) {
        for (const [x, y] of [
          [1, 1],
          [w - 2, 1],
          [1, h - 2],
          [w - 2, h - 2],
        ]) {
          if (px(x, y)[3] !== 0)
            out.errors.push(`угол (${x},${y}) не прозрачный`);
        }
      } else {
        const bg = px(2, 2);
        if (!(bg[0] > 220 && bg[1] > 232 && bg[2] > 235))
          out.errors.push(`подложка не светлая: rgba(${bg})`);
      }
      return out;
    },
    { url: b64, transparentCorners },
  );
  await page.close();
  return res;
}

async function main() {
  await mkdir(iconsDir, { recursive: true });
  const markSvg = await readFile(markPath, "utf8");
  // Внутренности знака без внешнего <svg> — вставляем в композицию.
  const body = markSvg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    // id градиентов знака уникальны, конфликтов с подложкой нет
    .trim();

  const targets = [
    {
      size: 512,
      file: "pwa-512x512.png",
      radius: 112,
      scale: 0.9,
      dyShift: 0.012,
      transparent: true,
    },
    {
      size: 192,
      file: "pwa-192x192.png",
      radius: 42,
      scale: 0.9,
      dyShift: 0.012,
      transparent: true,
    },
    {
      size: 512,
      file: "maskable-512x512.png",
      radius: 0,
      scale: 0.72,
      dyShift: 0.012,
      transparent: false,
    },
    {
      size: 180,
      file: "apple-touch-icon.png",
      radius: 0,
      scale: 0.86,
      dyShift: 0.012,
      transparent: false,
    },
  ];

  const browser = await chromium.launch();
  let failed = false;
  try {
    for (const t of targets) {
      const file = path.join(iconsDir, t.file);
      await renderPng(
        browser,
        compose({
          size: t.size,
          radius: t.radius,
          scale: t.scale,
          dyShift: t.dyShift,
          body,
        }),
        t.size,
        file,
        t.transparent,
      );
      const v = await verifyPng(browser, file, {
        transparentCorners: t.transparent,
      });
      const rel = path.relative(root, file);
      if (v.errors.length) {
        failed = true;
        console.log(`✗ ${rel}: ${v.errors.join("; ")}`);
      } else {
        console.log(`✓ ${rel} (${v.w}×${v.h})`);
      }
    }

    // Полный логотип: знак + надпись «ЗОРЬКА» (Inter 600, как в дизайн-системе).
    await renderLockup(browser, body);
    console.log("✓ design/brand/zorka-logo.svg + zorka-logo.png");
  } finally {
    await browser.close();
  }
  process.exit(failed ? 1 : 0);
}

// Лок-ап «знак + надпись»: вертикальная композиция на светлом фоне.
// Надпись набирается живым текстом Inter 600 в цвете --color-primary.
async function renderLockup(browser, body) {
  const font = (
    await readFile(
      path.join(root, "src/styles/fonts/inter-cyrillic-600-normal.woff2"),
    )
  ).toString("base64");
  const fontLatin = (
    await readFile(
      path.join(root, "src/styles/fonts/inter-latin-600-normal.woff2"),
    )
  ).toString("base64");
  const W = 720;
  const H = 860;
  const markH = 560;
  const k = markH / MARK_CROP.h;
  const markW = MARK_CROP.w * k;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F7FBFB"/>
      <stop offset="1" stop-color="${C.plate}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#plate)"/>
  <g transform="translate(${(W - markW) / 2} 74) scale(${k}) translate(${-MARK_CROP.x} ${-MARK_CROP.y})">
    ${body}
  </g>
  <text x="${W / 2}" y="790" text-anchor="middle"
        font-family="Inter" font-weight="600" font-size="112"
        letter-spacing="2" fill="#0C7878">ЗОРЬКА</text>
</svg>`;

  const svgFile = path.join(brandDir, "zorka-logo.svg");
  await writeFile(svgFile, svg);

  const page = await browser.newPage({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
  });
  await page.setContent(`<!doctype html><style>
    @font-face{font-family:Inter;font-weight:600;src:url(data:font/woff2;base64,${fontLatin}) format('woff2');unicode-range:U+0000-00FF;}
    @font-face{font-family:Inter;font-weight:600;src:url(data:font/woff2;base64,${font}) format('woff2');}
    html,body{margin:0;padding:0;background:transparent}
  </style><div style="width:${W}px;height:${H}px">${svg}</div>`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(200);
  const buf = await page.screenshot({
    clip: { x: 0, y: 0, width: W, height: H },
    omitBackground: true,
  });
  await page.close();
  await writeFile(path.join(brandDir, "zorka-logo.png"), buf);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
