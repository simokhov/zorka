// Зорька. Доменные типы (02-architecture: src/domain — чистая логика без зависимостей).

/** Справочник видов (ADR-0009) — глобальный, только чтение. */
export interface SpeciesRef {
  id: string;
  nameRu: string;
  nameLatin: string | null;
  family: string;
  isPredator: boolean;
  icon: string;
}

/** Сохранённое место ловли. */
export interface Place {
  id: string;
  userId: string;
  name: string;
  lat: number;
  lon: number;
  description: string | null;
}

/** Снимок погоды в момент ловли (03-data-model). */
export interface WeatherSnapshot {
  temp_c: number;
  feels_like_c: number | null;
  pressure_hpa: number | null;
  humidity_pct: number | null;
  wind_ms: number | null;
  wind_dir_deg: number | null;
  condition: string | null;
  owm_icon: string | null;
  captured_at: string;
}

/** Поимка — центральная сущность. */
export interface Catch {
  id: string;
  userId: string;
  speciesId: string;
  placeId: string | null;
  lat: number | null;
  lon: number | null;
  caughtAt: string;
  weightG: number | null;
  lengthMm: number | null;
  count: number;
  tackle: string | null;
  bait: string | null;
  depthM: number | null;
  weather: WeatherSnapshot | null;
  notes: string | null;
  deletedAt: string | null;
}
