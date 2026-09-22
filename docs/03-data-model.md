# Модель данных

Идентификаторы и DDL — на английском, комментарии — на русском. Источник истины — Postgres (Supabase). Все пользовательские таблицы защищены RLS (`user_id = auth.uid()`).

## ER-обзор

```
users (auth.users)
  └──► places (сохраненные места)
  └──► fishing_trips (выезды; роадмап)
          └──► catches (поимки)
                  ├──► catch_photos (фото)
                  └──► (species — глобальный справочник)
weather_cache (кэш ответов OWM, без RLS — доступ через Edge Function)
```

## Таблицы

### `species` — справочник видов рыбы (глобальный, только чтение из клиента)

| Поле | Тип | Описание |
|---|---|---|
| `id` | `uuid PK` | |
| `name_ru` | `text not null` | «Судак» |
| `name_latin` | `text` | `Sander lucioperca` |
| `family` | `text` | Семейство («Окунёвые») |
| `is_predator` | `boolean` | Для будущей аналитики |
| `icon` | `text` | Код иконки/эмодзи |
| `created_at` | `timestamptz` | |

Заполняется миграцией-сидом. Изменение справочника — только через миграции (ADR-0009).

### `places` — сохранённые места ловли

| Поле | Тип | Описание |
|---|---|---|
| `id` | `uuid PK` | |
| `user_id` | `uuid not null FK→auth.users` | |
| `name` | `text not null` | «Дамба у Старого моста» |
| `lat`, `lon` | `numeric not null` | WGS84 |
| `description` | `text` | Заметка о месте |
| `created_at` / `updated_at` | `timestamptz` | |

### `catches` — поимки (центральная сущность)

| Поле | Тип | Описание |
|---|---|---|
| `id` | `uuid PK` | |
| `user_id` | `uuid not null` | |
| `species_id` | `uuid FK→species` | Обязательное |
| `place_id` | `uuid FK→places null` | Заполнено, если поимка «на месте» |
| `lat`, `lon` | `numeric null` | Точка поимки (может отличаться от точки места) |
| `caught_at` | `timestamptz not null` | Момент поимки |
| `weight_g` | `int null` | Вес в граммах (точность важна для трофеев) |
| `length_mm` | `int null` | Длина в мм |
| `count` | `int not null default 1` | >1 для «хвоста» одной записью |
| `tackle` | `text null` | Снасть: «фидер», «спиннинг»... |
| `bait` | `text null` | Наживка/приманка |
| `depth_m` | `numeric(5,2) null` | Глубина в точке |
| `weather` | `jsonb null` | Снимок погоды в момент ловли (см. ниже) |
| `notes` | `text null` | Короткая заметка |
| `deleted_at` | `timestamptz null` | Мягкое удаление (корзина) |
| `created_at` / `updated_at` | `timestamptz` | |

**`weather` jsonb** — денормализованный снимок, чтобы статистика не зависела от кэша погоды:

```json
{
  "temp_c": 12.4, "feels_like_c": 10.1,
  "pressure_hpa": 1009, "humidity_pct": 78,
  "wind_ms": 4.2, "wind_dir_deg": 210,
  "condition": "clouds", "owm_icon": "04d",
  "captured_at": "2025-05-18T04:12:00Z"
}
```

### `catch_photos`

| Поле | Тип | Описание |
|---|---|---|
| `id` | `uuid PK` | |
| `catch_id` | `uuid FK→catches on delete cascade` | |
| `user_id` | `uuid not null` | Дубль для простого RLS |
| `storage_path` | `text not null` | Путь в bucket `catch-photos` |
| `thumb_path` | `text not null` | Путь превью |
| `width`, `height` | `int` | |
| `created_at` | `timestamptz` | |

Файлы: `{user_id}/{catch_id}/{uuid}.jpg` (оригинал) и `.../thumb_{uuid}.webp` (≤ 480px). Превью генерируется на клиенте (canvas) до загрузки (ADR-0007).

### `fishing_trips` — выезды (создаём таблицу в MVP-схеме, UI — роадмап)

| Поле | Тип | Описание |
|---|---|---|
| `id`, `user_id` | | |
| `place_id` | `uuid FK null` | Основное место выезда |
| `started_at`, `ended_at` | `timestamptz` | |
| `title` | `text` | «Открытие сезона на Оке» |
| `notes` | `text` | Текст дневника |
| `created_at` / `updated_at` | | |

### `weather_cache` (нет RLS; доступ только Edge Function через service role)

| Поле | Тип | Описание |
|---|---|---|
| `lat`, `lon` (округлённые до 0.02°) | `numeric` | Ключ кэша |
| `mode` | `text` | `current` / `forecast` |
| `payload` | `jsonb` | Ответ OWM |
| `fetched_at` | `timestamptz` | TTL: current 30 мин, forecast 3 ч |

## Локальная схема (IndexedDB / Dexie)

| Store | Назначение |
|---|---|
| `catches` | Зеркало сервера + локальные `synced:'pending'` (outbox, ADR-0004) |
| `catch_photos_queue` | Blob-фото, ожидающие загрузки |
| `places`, `species` | Кэш справочников |
| `weather_recent` | Последние ответы погоды для показа без сети |

## Индексы

- `catches (user_id, caught_at desc)` — лента;
- `catches (user_id, species_id)` + `catches (user_id, place_id)` — статистика;
- `catches` GIN по `weather` — для погодной аналитики (этап 2);
- `places (user_id)`;
- `weather_cache (lat, lon, mode, fetched_at)`.

## Политики (главные)

```sql
alter table catches enable row level security;
create policy "own rows" on catches
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- аналогично для places, catch_photos, fishing_trips
-- species: for select using (true)
```

## Эволюция

- Этап 2 (публичный): таблица `invites`, флаг `users.is_beta`; ничего в существующей схеме не ломается.
- Прогноз клёва: отдельная таблица агрегатов `bite_forecast`, пересчитываемая фоново из `catches.weather` — не затрагивает запись поимки.
