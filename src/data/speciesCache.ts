// Зорька. Кэш справочников в Dexie (ADR-0004): обновление при сети,
// чтение всегда локальное (useLiveQuery) — экраны работают офлайн.
import { db } from "./db";
import { listSpecies } from "./speciesRepository";

/** Обновить кэш справочника видов из Postgres. Без сети — молча пропускаем. */
export async function refreshSpeciesCache(): Promise<void> {
  try {
    const list = await listSpecies();
    const now = new Date().toISOString();
    await db.species.bulkPut(list.map((sp) => ({ ...sp, cachedAt: now })));
  } catch {
    // оффлайн — работаем на локальном кэше
  }
}
