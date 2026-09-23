-- Зорька. Миграция 0002: основные пользовательские таблицы (03-data-model.md)
-- places, catches, catch_photos, fishing_trips, weather_cache
-- + RLS (user_id = auth.uid()), индексы под ленту и статистику.

-- ------------------------------------------------------------------
-- places — сохранённые места ловли
-- ------------------------------------------------------------------
create table if not exists places (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  lat         numeric not null check (lat between -90 and 90),
  lon         numeric not null check (lon between -180 and 180),
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table places enable row level security;
create policy "own rows" on places
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists places_user_idx on places (user_id);

-- ------------------------------------------------------------------
-- catches — поимки (центральная сущность)
-- ------------------------------------------------------------------
create table if not exists catches (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  species_id uuid not null references species (id),
  place_id   uuid references places (id) on delete set null,
  lat        numeric,
  lon        numeric,
  caught_at  timestamptz not null,
  weight_g   int check (weight_g > 0),
  length_mm  int check (length_mm > 0),
  count      int not null default 1 check (count > 0),
  tackle     text,
  bait       text,
  depth_m    numeric(5, 2),
  weather    jsonb,
  notes      text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table catches enable row level security;
create policy "own rows" on catches
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Лента: свежие поимки пользователя.
create index if not exists catches_user_caught_at_idx
  on catches (user_id, caught_at desc);

-- Статистика по видам и местам.
create index if not exists catches_user_species_idx on catches (user_id, species_id);
create index if not exists catches_user_place_idx on catches (user_id, place_id);

-- Погодная аналитика (роадмап: прогноз клёва).
create index if not exists catches_weather_gin on catches using gin (weather);

-- ------------------------------------------------------------------
-- catch_photos — фото поимок
-- ------------------------------------------------------------------
create table if not exists catch_photos (
  id           uuid primary key default gen_random_uuid(),
  catch_id     uuid not null references catches (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  thumb_path   text not null,
  width        int,
  height       int,
  created_at   timestamptz not null default now()
);

alter table catch_photos enable row level security;
create policy "own rows" on catch_photos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists catch_photos_catch_idx on catch_photos (catch_id);

-- ------------------------------------------------------------------
-- fishing_trips — выезды (таблица в MVP-схеме, UI — роадмап)
-- ------------------------------------------------------------------
create table if not exists fishing_trips (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  place_id   uuid references places (id) on delete set null,
  started_at timestamptz not null,
  ended_at   timestamptz,
  title      text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table fishing_trips enable row level security;
create policy "own rows" on fishing_trips
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists fishing_trips_user_started_idx
  on fishing_trips (user_id, started_at desc);

-- ------------------------------------------------------------------
-- updated_at: автоподдержка триггером
-- ------------------------------------------------------------------
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_places_updated_at
  before update on places
  for each row execute function set_updated_at();

create trigger set_catches_updated_at
  before update on catches
  for each row execute function set_updated_at();

create trigger set_fishing_trips_updated_at
  before update on fishing_trips
  for each row execute function set_updated_at();

-- ------------------------------------------------------------------
-- weather_cache — кэш ответов OWM. Без RLS: доступ только через
-- Edge Function с service-role ключом.
-- ------------------------------------------------------------------
create table if not exists weather_cache (
  lat        numeric not null,
  lon        numeric not null,
  mode       text not null check (mode in ('current', 'forecast')),
  payload    jsonb not null,
  fetched_at timestamptz not null default now(),
  primary key (lat, lon, mode)
);

create index if not exists weather_cache_fetched_idx
  on weather_cache (lat, lon, mode, fetched_at desc);
