// Зорька. Sync engine (ADR-0004): оффлайн-создание поимки → очередь (outbox) →
// FIFO-досылка при появлении сети. Состояния §6.11 видны в трёх местах:
// баннер оффлайна, бейдж карточки, счётчик таб-бара.
import { supabase } from "../lib/supabase";
import { db, type LocalCatch } from "./db";

function toRow(c: LocalCatch) {
  return {
    id: c.id,
    user_id: c.userId,
    species_id: c.speciesId,
    place_id: c.placeId,
    lat: c.lat,
    lon: c.lon,
    caught_at: c.caughtAt,
    weight_g: c.weightG,
    length_mm: c.lengthMm,
    count: c.count,
    tackle: c.tackle,
    bait: c.bait,
    depth_m: c.depthM,
    weather: c.weather,
    notes: c.notes,
  };
}

/** Локальное создание поимки: сразу в Dexie как pending + запись в outbox. */
export async function enqueueCatchDraft(
  draft: Omit<LocalCatch, "syncState">,
): Promise<string> {
  const local: LocalCatch = { ...draft, syncState: "pending" };
  await db.transaction("rw", db.catches, db.outbox, async () => {
    await db.catches.put(local);
    await db.outbox.add({
      kind: "create-catch",
      catchId: local.id,
      createdAt: new Date().toISOString(),
    });
  });
  void flushOutbox();
  return local.id;
}

let flushing = false;

/** Досылка очереди FIFO. Вызывается при старте, по 'online' и после постановки в очередь. */
export async function flushOutbox(): Promise<void> {
  if (flushing || !navigator.onLine) return;
  flushing = true;
  try {
    for (;;) {
      const entry = await db.outbox.orderBy("seq").first();
      if (entry === undefined) break;
      if (entry.kind !== "create-catch") {
        await db.outbox.delete(entry.seq!);
        continue;
      }
      const local = await db.catches.get(entry.catchId);
      if (local === undefined) {
        await db.outbox.delete(entry.seq!);
        continue;
      }
      if (local.syncState === "synced") {
        await db.outbox.delete(entry.seq!);
        continue;
      }

      await db.catches.update(local.id, { syncState: "syncing" });
      const { error } = await supabase.from("catches").insert(toRow(local));
      if (error === null) {
        await db.transaction("rw", db.catches, db.outbox, async () => {
          await db.catches.update(local.id, { syncState: "synced" });
          await db.outbox.delete(entry.seq!);
        });
      } else if (isNetworkError(error.message)) {
        await db.catches.update(local.id, { syncState: "pending" });
        break; // сеть пропала — досылаем позже
      } else {
        // серверная ошибка: состояние «Не отправлено · Повторить»
        await db.catches.update(local.id, { syncState: "error" });
        break;
      }
    }
  } finally {
    flushing = false;
  }
}

function isNetworkError(message: string): boolean {
  return /fetch|network|Failed to fetch|NetworkError|TypeError/i.test(message);
}

/** Повторная отправка записи с ошибкой. */
export async function retryCatch(id: string): Promise<void> {
  await db.catches.update(id, { syncState: "pending" });
  await db.outbox.add({
    kind: "create-catch",
    catchId: id,
    createdAt: new Date().toISOString(),
  });
  void flushOutbox();
}

/** Подписка на события сети и стартовая досылка. */
export function startSyncEngine(): void {
  window.addEventListener("online", () => void flushOutbox());
  void flushOutbox();
}
