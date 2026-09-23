// Зорька. Локальная схема IndexedDB / Dexie (03-data-model, ADR-0004).
// catches — зеркало сервера + локальные записи со статусом синхронизации;
// species/places — кэш справочников; weather_recent — последние ответы погоды.
import Dexie, { type EntityTable } from "dexie";
import type { Catch, Place, SpeciesRef } from "../domain/types";

export type SyncState = "pending" | "syncing" | "synced" | "error";

/** Локальная поимка: домен + статус синхронизации. */
export interface LocalCatch extends Catch {
  syncState: SyncState;
}

/** Очередь операций: FIFO, досылка при появлении сети. */
export interface OutboxEntry {
  seq?: number;
  kind: "create-catch";
  catchId: string;
  createdAt: string;
}

export interface CachedSpecies extends SpeciesRef {
  cachedAt: string;
}

export interface CachedPlace extends Place {
  cachedAt: string;
}

export interface WeatherRecent {
  key: string;
  payload: unknown;
  fetchedAt: string;
}

export const db = new Dexie("zorka") as Dexie & {
  catches: EntityTable<LocalCatch, "id">;
  outbox: EntityTable<OutboxEntry, "seq">;
  species: EntityTable<CachedSpecies, "id">;
  places: EntityTable<CachedPlace, "id">;
  weather_recent: EntityTable<WeatherRecent, "key">;
};

db.version(1).stores({
  catches: "id, userId, caughtAt, syncState, speciesId, placeId",
  outbox: "++seq, catchId",
  species: "id, nameRu",
  places: "id, userId",
  weather_recent: "key",
});
