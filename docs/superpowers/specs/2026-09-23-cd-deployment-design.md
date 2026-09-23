# Спека: CD — доставка фронтенда и self-host Supabase на виртуалку Яндекс.Облака

Дата: 2026-09-23
Статус: одобрено заказчиком (диалог), фаза 1 закрыта, CI уже настроен.

## Цель

Автоматическая доставка каждого коммита в `main` на продакшен-окружение: статический фронтенд PWA + self-host стек Supabase на одной виртуалке Яндекс.Облака. Прод должен работать автономно, без зависимости от SaaS-провайдеров.

## Решения (зафиксированы в диалоге)

| Вопрос | Решение |
|---|---|
| Объём CD | Фронт + Supabase (миграции, Edge Functions) — всё автоматом |
| Хостинг | Одна VM в Яндекс.Облаке, self-host Supabase рядом со статикой |
| Домен | Заказчик покупает; TLS Let's Encrypt |
| Среды | local (есть) + production; staging отложен |
| Бэкапы | Вне скоупа (решение заказчика от 2026-09-23) |
| Подход | Docker Compose на VM + деплой из GitHub Actions по SSH |

## 1. Инфраструктура виртуалки

- VM: 2 vCPU / 4 ГБ RAM / 40 ГБ SSD, Ubuntu 24.04, public IP. Наружу — только 80/443 (SSH по ключу).
- Docker Compose, файлы в `deploy/compose/` (версионируются):
  - `front` (nginx): статика из `/opt/zorka/current`, 80/443, reverse proxy `https://<домен>/sb/v1/*` → kong. Всё приложение и Supabase — на одном домене, без CORS.
  - Supabase-стек из официального `supabase/docker` compose: db (Postgres 17), auth (GoTrue), rest (PostgREST), storage, kong, edge-runtime (volume: `supabase/functions/`). Studio и analytics не поднимаются. Realtime — не поднимается (приложение его не использует).
  - `certbot`: выпуск и автообновление сертификата (cron), рестарт `front` после обновления.
  - `supabase-cli`: одноразовый образ (не daemon) для `db push` миграций из пайплайна.
- Конфигурация через `.env` на VM (в git не попадает): `DOMAIN`, `SITE_URL`, `JWT_SECRET`, `ANON_KEY`/`SERVICE_KEY` (генерируются один раз), `POSTGRES_PASSWORD`, `OWM_API_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Спецификация VM подобрана под стек без Studio/analytics; при нехватке RAM — stop → resize в Яндекс.Облаке без пересоздания.

## 2. CD-пайплайн

`.github/workflows/cd.yml`, триггер: push в `main`.

1. `pnpm install --frozen-lockfile` → `pnpm verify` → `vite build` с ENV:
   `VITE_SUPABASE_URL=https://<домен>/sb`, `VITE_SUPABASE_PUBLISHABLE_KEY` (из GitHub Secrets).
2. Подключение к VM по SSH: `VM_HOST` + `VM_SSH_KEY` (отдельный deploy-ключ, пользователь `deploy`).
3. Релиз фронта: `rsync dist/ → /opt/zorka/releases/<git-sha>/`; атомарное переключение `ln -sfn` симлинка `/opt/zorka/current`; retention — 3 последних релиза.
4. Миграции: `rsync supabase/migrations/` на VM → `docker compose run --rm supabase-cli db push`. История в схеме `supabase_migrations` — применяются только новые; сид 51 вида идемпотентен (этап 3).
5. Edge Functions: `rsync supabase/functions/` → volume edge-runtime → рестарт контейнера `supabase-edge`.
6. Health-check: `https://<домен>/` → 200 и содержит `/assets/`; `https://<домен>/sb/v1/auth/health` → 200. При провале джоба красная, предыдущий релиз продолжает работать (симлинк не тронут).

Секреты GitHub: `VM_HOST`, `VM_SSH_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
Секреты VM (одноразовая настройка `.env`): OWM_API_KEY, JWT_SECRET, POSTGRES_PASSWORD, ANON/SERVICE ключи.

Рольбэк: ручной `ssh vm "ln -sfn /opt/zorka/releases/<prev> current && docker compose restart front"` — инструкция в `deploy/README.md`.

## 3. Домен, TLS, первичная настройка

- Заказчик покупает домен; одна A-запись → IP виртуалки. Поддомены не нужны.
- TLS: certbot `--webroot` после первичного запуска nginx; автообновление по cron (2 раза/мес) + рестарт `front`; HTTP → HTTPS, HSTS.
- Первичная настройка VM (одноразовая, шаги в `deploy/README.md`): создать VM → Docker + compose plugin → пользователь `deploy` + SSH-ключ → залить `deploy/compose/` и `.env` → `docker compose up -d` → certbot → A-запись.
- До покупки домена весь пайплайн отлаживается по IP (`http://<IP>/`, `http://<IP>/sb/v1/auth/health`); HTTPS-часть включается после привязки домена. Service worker и установка PWA требуют HTTPS — финальная приёмка на устройстве после этого.

## 4. Риски

- 4 ГБ RAM для стека Supabase — впритык; без Studio/analytics/realtime достаточно, при нехватке — resize VM.
- Edge Functions в self-host деплоятся через volume + рестарт, а не `supabase functions deploy` (облачный путь) — учтено в пайплайне.
- Бэкапы отсутствуют по решению заказчика: потеря VM = потеря данных. Пересмотр — отдельным решением.

## 5. Артефакты реализации

- `deploy/compose/docker-compose.yml`, `deploy/compose/nginx.conf`, `deploy/compose/.env.example`
- `deploy/README.md` — первичная настройка VM + рольбэк
- `.github/workflows/cd.yml`
- Правка `docs/02-architecture.md` §среды: production = self-host на VM (вместо «Vercel/Netlify MVP»)
