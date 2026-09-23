# CD Implementation Plan — доставка на VM Яндекс.Облака

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Автоматический деплой статики PWA + self-host Supabase (Postgres, Auth, REST, Storage, Edge Functions) на одну VM Яндекс.Облака из GitHub Actions.

**Architecture:** Один `docker compose` на VM: nginx (статика + прокси `/sb` → kong), supabase-стек без Studio/analytics/realtime, certbot. CD: push в `main` → verify → build → rsync → атомарный симлинк → `db push` миграций → рестарт edge-runtime → health-check.

**Tech Stack:** Docker Compose, nginx, официальный supabase/docker стек, supabase CLI (db push), GitHub Actions, rsync по SSH.

**Spec:** `docs/superpowers/specs/2026-09-23-cd-deployment-design.md`

## Global Constraints

- Наружу открыты только порты 80/443 (SSH — по ключу).
- Секреты в git не попадают: на VM — `.env`, в GitHub — только `VM_HOST`, `VM_SSH_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Приложение и Supabase — на одном домене: `https://<домен>/sb/v1/*` → kong (без поддоменов и CORS).
- Релизы фронта: `/opt/zorka/releases/<sha>`, атомарный симлинк `current`, retention 3.
- Бэкапы вне скоупа (решение заказчика).
- Локальная проверка compose — на альтернативных портах (локальный стек этапа 3 занимает 54321–54327, 8080–8090).

---

### Task 1: Скелет compose-стека и .env

**Files:**
- Create: `deploy/compose/docker-compose.yml`
- Create: `deploy/compose/.env.example`
- Create: `deploy/compose/kong.yml`

**Interfaces:**
- Produces: сервисы `front`, `kong`, `supabase-db`, `supabase-auth`, `supabase-rest`, `supabase-storage`, `supabase-edge`, `supabase-cli`; сеть `zorka-net`; volume-ы `db-data`, `functions-src`, `api-keys`.

- [ ] **Step 1: Написать docker-compose.yml**

```yaml
# deploy/compose/docker-compose.yml
# Зорька: self-host Supabase + nginx-фронт на одной VM.
name: zorka

services:
  supabase-db:
    image: supabase/postgres:15.8.1.049
    restart: unless-stopped
    volumes:
      - db-data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

  supabase-auth:
    image: supabase/gotrue:v2.164.0
    restart: unless-stopped
    depends_on:
      supabase-db: { condition: service_healthy }
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      API_EXTERNAL_URL: ${SITE_URL}/sb
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://supabase_auth_admin:${POSTGRES_PASSWORD}@supabase-db:5432/postgres
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_EXTERNAL_EMAIL_ENABLED: "true"
      GOTRUE_MAILER_AUTOCONFIRM: "true" # MVP: подтверждение письмом включим вместе с SMTP
      GOTRUE_SITE_URL: ${SITE_URL}
      GOTRUE_DISABLE_SIGNUP: "false"
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O- http://localhost:9999/health | grep -q live"]
      interval: 5s
      timeout: 5s
      retries: 10

  supabase-rest:
    image: postgrest/postgrest:v12.2.0
    restart: unless-stopped
    depends_on:
      supabase-db: { condition: service_healthy }
    environment:
      PGRST_DB_URI: postgres://authenticator:${POSTGRES_PASSWORD}@supabase-db:5432/postgres
      PGRST_DB_SCHEMAS: public,storage
      PGRST_DB_ANON_ROLE: anon
      PGRST_JWT_SECRET: ${JWT_SECRET}

  supabase-storage:
    image: supabase/storage-api:v1.0.6
    restart: unless-stopped
    depends_on:
      supabase-db: { condition: service_healthy }
    volumes:
      - storage-data:/var/lib/storage
    environment:
      ANON_KEY: ${ANON_KEY}
      SERVICE_KEY: ${SERVICE_KEY}
      POSTGREST_URL: http://supabase-rest:3000
      PGRST_JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgres://supabase_storage_admin:${POSTGRES_PASSWORD}@supabase-db:5432/postgres
      FILE_SIZE_LIMIT: 52428800
      STORAGE_BACKEND: file
      GLOBAL_S3_BUCKET: not-used

  supabase-edge:
    image: supabase/edge-runtime:v1.74.3
    restart: unless-stopped
    depends_on:
      supabase-db: { condition: service_healthy }
    volumes:
      - functions-src:/home/deno/functions
    environment:
      EDGE_RUNTIME_SEED: "true"
      SUPABASE_URL: http://kong:8000
      SUPABASE_SERVICE_ROLE_KEY: ${SERVICE_KEY}
      OWM_API_KEY: ${OWM_API_KEY}

  kong:
    image: kong:2.8.1
    restart: unless-stopped
    depends_on:
      supabase-auth: { condition: service_healthy }
    ports:
      - "127.0.0.1:8000:8000"
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /var/lib/kong/kong.yml
      KONG_DNS_ORDER: LAST,A,CNAME
      KONG_PLUGINS: request-size-limiting
      KONG_NGINX_PROXY_PROXY_BUFFER_SIZE: 160k
      KONG_NGINX_PROXY_PROXY_BUFFERS: 64x160k
    volumes:
      - ./kong.yml:/var/lib/kong/kong.yml:ro

  front:
    image: nginx:1.27-alpine
    restart: unless-stopped
    depends_on:
      - kong
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /opt/zorka/current:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro

  supabase-cli:
    image: supabase/cli:v2.117.0
    profiles: ["tools"]
    volumes:
      - ./migrations:/workspace/migrations:ro
    working_dir: /workspace

volumes:
  db-data:
  storage-data:
  functions-src:
```

Примечания: `api-keys` volume из спеки не нужен — ключи приходят через env; это упрощение фиксируем здесь. `migrations` монтируется с хоста (`/opt/zorka/migrations`, кладёт CD-джоба) — пути уже продакшеновые; для локальной отладки путь тот же (см. Task 3).

- [ ] **Step 2: Написать kong.yml (декларативные роуты Supabase)**

```yaml
# deploy/compose/kong.yml
_format_version: "1.1"
services:
  - name: auth-v1
    url: http://supabase-auth:9999/1
    routes: [{ name: auth-v1-all, strip_path: true, paths: ["/auth/v1"] }]
  - name: rest-v1
    url: http://supabase-rest:3000/1
    routes: [{ name: rest-v1-all, strip_path: true, paths: ["/rest/v1"] }]
  - name: storage-v1
    url: http://supabase-storage:5000
    routes: [{ name: storage-v1-all, strip_path: true, paths: ["/storage/v1"] }]
  - name: functions-v1
    url: http://supabase-edge:8081
    routes: [{ name: functions-v1-all, strip_path: true, paths: ["/functions/v1"] }]
consumers:
  - username: anon
    keyauth_credentials: [{ key: ${ANON_KEY} }]
  - username: service_role
    keyauth_credentials: [{ key: ${SERVICE_KEY} }]
```

Плюс подставить ключи: kong.yml — шаблон. Правило: kong.yml генерируется entrypoint-скриптом из env? Kong не подставляет env в декларативный конфиг. Решение — Task 1 Step 3.

- [ ] **Step 3: Скрипт рендера kong.yml из env (Kong не интерполирует env)**

Create: `deploy/compose/render-kong.sh`

```sh
#!/bin/sh
# Рендер kong.yml из .env (Kong не подставляет env в declarative config).
set -eu
: "${ANON_KEY:?ANON_KEY обязателен}"
: "${SERVICE_KEY:?SERVICE_KEY обязателен}"
sed -e "s|\${ANON_KEY}|${ANON_KEY}|" -e "s|\${SERVICE_KEY}|${SERVICE_KEY}|" \
  /templates/kong.yml.tmpl > /var/lib/kong/kong.yml
```

Изменения: `kong.yml` → `kong.yml.tmpl` (с `${ANON_KEY}`/`${SERVICE_KEY}`), в compose у kong volumes:
`- ./kong.yml.tmpl:/templates/kong.yml.tmpl:ro` и `- kong-rendered:/var/lib/kong`, command: `["sh","/templates/render-kong.sh","&&","kong","docker-start"]` — упрощение: используем entrypoint-обёртку `deploy/compose/kong-entrypoint.sh`, монтируем её и `command: sh /entrypoint.sh`.

- [ ] **Step 4: .env.example**

```bash
# deploy/compose/.env.example — скопировать в .env на VM и заполнить
DOMAIN=zorka.example.ru
SITE_URL=https://zorka.example.ru

# Сгенерировать: openssl rand -hex 32
JWT_SECRET=change-me-64-hex

# Генерируются из JWT_SECRET (см. deploy/README.md) либо openssl rand -hex 32,
# но ANON/SERVICE — это JWT с фиксированной ролью; способ генерации в README.
ANON_KEY=change-me
SERVICE_KEY=change-me

POSTGRES_PASSWORD=change-me
OWM_API_KEY=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

- [ ] **Step 5: Проверить конфиг**

Run: `cd deploy/compose && cp .env.example .env && docker compose --env-file .env config --quiet`
Expected: без ошибок (warnings об обязательных переменных — заполнив .env, получаем чистый вывод).

- [ ] **Step 6: Commit**

```bash
git add deploy/compose/
git commit -m "deploy: compose-стек self-host Supabase + nginx-фронт"
```

### Task 2: nginx.conf — статика, прокси /sb, gzip

**Files:**
- Create: `deploy/compose/nginx.conf`

**Interfaces:**
- Consumes: сервис `kong` из Task 1 (127.0.0.1:8000 внутри сети compose — `http://kong:8000`).
- Produces: маршрутизация `https://<домен>/` → статика, `/sb/` → kong; публичный контракт API: `VITE_SUPABASE_URL=https://<домен>/sb`.

- [ ] **Step 1: nginx.conf**

```nginx
# deploy/compose/nginx.conf
# HTTP: ACME-челлендж + редирект. HTTPS — после выпуска сертификата certbot'ом.
server {
  listen 80;
  server_name _;

  location /.well-known/acme-challenge/ { root /var/www/certbot; }

  # До выпуска сертификата — отдаём всё по HTTP (отладка по IP).
  # После выпуска certbot добавит редирект (см. deploy/README.md, step certbot).
  include /etc/nginx/conf.d/app.inc*;
}
```

Для простоты: nginx.conf пишем как единый файл сразу с HTTPS-сервером и map для сертификатов? Усложнение. Решение: два файла — `nginx.conf` (HTTP + include app) и приложение выносим в `app.inc`, а certbot после выпуска меняет симлинк `app.inc.enabled` → https-версии. Упростить: один файл, HTTPS-блок закомментирован, раскомментирование — шаг первичной настройки (README). Это честный MVP, фиксируем.

```nginx
# deploy/compose/nginx.conf — полная версия
gzip on;
gzip_types text/css application/javascript application/json image/svg+xml;
gzip_min_length 1024;

server {
  listen 80;
  server_name _;

  location /.well-known/acme-challenge/ { root /var/www/certbot; }

  location /sb/ {
    # /sb/auth/v1/... → /auth/v1/... на kong
    proxy_pass http://kong:8000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 50m;
  }

  # PWA: кэш сервис-воркера не мешаем
  location = /sw.js { add_header Cache-Control "no-cache"; root /usr/share/nginx/html; }
  location = /index.html { add_header Cache-Control "no-cache"; root /usr/share/nginx/html; }

  location /assets/ { expires 30d; add_header Cache-Control "public, immutable"; root /usr/share/nginx/html; }

  location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
  }
}

# HTTPS включается после certbot (deploy/README.md): блок-заготовка раскомментируется.
# server {
#   listen 443 ssl;
#   server_name ${DOMAIN};
#   ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
#   ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
#   ... (те же location, скопировать из блока 80)
# }
```

`${DOMAIN}` — nginx не интерполирует env; для продовой HTTPS-версии CD-джоба рендерит `nginx.https.conf` из шаблона `envsubst` на VM (Task 4, Step 3). Фиксируем: в Task 4 на VM выполняется `envsubst '$DOMAIN' < nginx.https.conf.tmpl > nginx.https.conf`.

- [ ] **Step 2: Локальная проверка статики и прокси**

Запустить мини-стенд: пустой `dist/index.html` с текстом, `docker compose up front kong` (kong может не подняться без стека — проверяем только отдачу статики и 502 от /sb/):
Run: `cd deploy/compose && docker compose --env-file .env up -d front && curl -s localhost/ | grep -q ZORKATEST && echo OK`
Expected: `OK`.

- [ ] **Step 3: Commit**

```bash
git add deploy/compose/nginx.conf
git commit -m "deploy: nginx — статика, /sb-прокси, gzip, кэш-заголовки PWA"
```

### Task 3: Локальный прогон стека + миграции + functions

**Files:**
- Create: `deploy/compose/functions-src` mount (используем существующий `supabase/functions/`)
- Modify: `deploy/compose/docker-compose.yml` (volume functions-src привязка к ./supabase/functions на время отладки)

- [ ] **Step 1: Поднять полный стек локально на альтернативных портах**

`front` временно на `8080:80` (локальный стек этапа 3 занимает 80). Хост-пути для отладки:
`functions-src` → bind `../../supabase/functions`, `migrations` → bind `../../supabase/migrations`.

Run: `cd deploy/compose && docker compose --env-file .env up -d`
Expected: все контейнеры healthy/running: `docker compose ps`.

- [ ] **Step 2: Применить миграции через CLI-образ**

```bash
cd deploy/compose
docker compose --env-file .env run --rm \
  supabase-cli db push \
  --db-url "postgres://postgres:${POSTGRES_PASSWORD}@supabase-db:5432/postgres"
```
Expected: `Applying migration 0001_species.sql... 0002... 0003... Finished`.

- [ ] **Step 3: Health-checks**

```bash
curl -s localhost:8080/ | grep -q ZORKATEST && echo front-OK
curl -s localhost:8080/sb/v1/auth/health | grep -q live && echo auth-OK
curl -s localhost:8080/rest/v1/species?select=name_ru -H "apikey: $ANON_KEY" | grep -q Сазан && echo rest-OK
```
Expected: `front-OK auth-OK rest-OK`.

- [ ] **Step 4: get-weather через edge-runtime**

```bash
curl -s -X POST localhost:8080/sb/v1/functions/v1/get-weather \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"lat":55.75,"lon":37.62,"mode":"current"}' | head -c 200
```
Expected: JSON OWM (или `OWM error` 401 — если ключ-заглушка; важен сам маршрут).

- [ ] **Step 5: Сквозной смоук фронта против стенда**

`.env` временно: `VITE_SUPABASE_URL=http://localhost:8080/sb`, ANON → `VITE_SUPABASE_PUBLISHABLE_KEY` в корневом `.env`; `pnpm build`; rsync dist в тестовый current; прогнать `scripts/smoke-offline.mjs` против `localhost:8080`.
Expected: все шаги смоука зелёные (регистрация, оффлайн-сохранение, досыл, sw=1).

- [ ] **Step 6: Откатить отладочные привязки портов/путей в compose к прод-значениям, commit**

```bash
git add deploy/compose/
git commit -m "deploy: стек проверен локально — миграции, auth health, rest, get-weather, смоук"
```

### Task 4: CD-workflow и deploy/README

**Files:**
- Create: `.github/workflows/cd.yml`
- Create: `deploy/README.md`
- Create: `deploy/compose/nginx.https.conf.tmpl`

**Interfaces:**
- Consumes: compose-стек Task 1–3 (сервисы `front`, `supabase-cli`, `supabase-edge`), health-контракты Task 3.
- Produces: автоматический деплой из `main`; секреты GitHub `VM_HOST`, `VM_SSH_KEY`, `VITE_SUPABASE_PUBLISHABLE_KEY`.

- [ ] **Step 1: .github/workflows/cd.yml**

```yaml
name: CD

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    concurrency: deploy
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { version: 12 }

      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }

      - run: pnpm install --frozen-lockfile

      - name: Build
        env:
          VITE_SUPABASE_URL: https://${{ secrets.VM_HOST }}/sb
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
        run: pnpm build

      - name: SSH key
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.VM_SSH_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -H ${{ secrets.VM_HOST }} >> ~/.ssh/known_hosts

      - name: Upload release
        run: |
          SHA=${GITHUB_SHA::8}
          rsync -az --delete dist/ deploy@${{ secrets.VM_HOST }}:/opt/zorka/releases/$SHA/
          rsync -az supabase/migrations/ deploy@${{ secrets.VM_HOST }}:/opt/zorka/migrations/
          rsync -az supabase/functions/ deploy@${{ secrets.VM_HOST }}:/opt/zorka/functions/

      - name: Switch release
        run: >
          ssh deploy@${{ secrets.VM_HOST }}
          "ln -sfn /opt/zorka/releases/${GITHUB_SHA::8} /opt/zorka/current &&
           docker compose -p zorka -f /opt/zorka/compose/docker-compose.yml --env-file /opt/zorka/compose/.env up -d front"

      - name: Migrations
        run: >
          ssh deploy@${{ secrets.VM_HOST }}
          "cd /opt/zorka/compose &&
           docker compose --env-file .env run --rm supabase-cli db push
           --db-url 'postgres://postgres:'\"'\"\$POSTGRES_PASSWORD\"'\"'@supabase-db:5432/postgres'"

      - name: Edge functions restart
        run: >
          ssh deploy@${{ secrets.VM_HOST }}
          "cd /opt/zorka/compose &&
           docker compose --env-file .env restart supabase-edge"

      - name: Health check (HTTP; после TLS — HTTPS)
        run: |
          for i in 1 2 3 4 5; do
            curl -fsS http://${{ secrets.VM_HOST }}/ | grep -q '/assets/' && front=ok || front=fail
            curl -fsS http://${{ secrets.VM_HOST }}/sb/v1/auth/health | grep -q live && auth=ok || auth=fail
            [ "$front" = ok ] && [ "$auth" = ok ] && exit 0
            sleep 10
          done
          exit 1

      - name: Cleanup old releases (keep 3)
        if: success()
        run: >
          ssh deploy@${{ secrets.VM_HOST }}
          "ls -1dt /opt/zorka/releases/* | tail -n +4 | xargs -r rm -rf"
```

- [ ] **Step 2: nginx.https.conf.tmpl + deploy/README.md**

README содержит: генерацию JWT_SECRET/ANON/SERVICE (команды `openssl rand -hex 32` + команда `supabase genkeys`-эквивалент: скрипт `deploy/make-keys.sh` — HS256-JWT c `role` anon/service_role, iat/expiration 10 лет), шаги первичной настройки VM из спеки §3, раскомментирование/рендер HTTPS-блока (`envsubst '$DOMAIN' < nginx.https.conf.tmpl > nginx.conf`), certbot команды, рольбэк, включение HTTPS в health-check.

nginx.https.conf.tmpl: копия HTTP-блока с `listen 443 ssl; server_name ${DOMAIN}; ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem; ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;`.

- [ ] **Step 3: Валидация**

Run: `python3 -c "import yaml;yaml.safe_load(open('.github/workflows/cd.yml'))" && bash -n deploy/compose/render-kong.sh && echo OK`
Expected: `OK`.

- [ ] **Step 4: Commit + push (первый реальный прогон CD возможен после создания VM)**

```bash
git add .github/workflows/cd.yml deploy/
git commit -m "deploy: CD-workflow (rsync-релиз, db push, edge restart, health-check) + README настройки VM"
git push
```

### Task 5: Документация

**Files:**
- Modify: `docs/02-architecture.md:83` (хостинг)
- Modify: `docs/07-phase1-plan.md` (пометка: CI включён после появления удалённого репозитория; CD — см. спеку)

- [ ] **Step 1: Правки**

`02-architecture.md:83` →
`- **Клиент:** статический бандл (Vite) + self-host Supabase на одной VM Яндекс.Облака; CD из main — GitHub Actions (см. спеку CD).`

`07-phase1-plan.md` → в строке про CI добавить: «(CI включён 2026-09-23, workflow `ci.yml`)».

- [ ] **Step 2: Verify + commit + push**

```bash
pnpm verify && git add docs/ && git commit -m "docs: хостинг и CD зафиксированы (VM Яндекс.Облака, self-host Supabase)" && git push
```

## Self-Review

- Spec coverage: §1 compose (Task 1–2), §2 пайплайн (Task 4), §3 TLS/первичная настройка (Task 2 + README Task 4), §5 артефакты (все tasks) — покрыто. Риски RAM/edge-volume учтены в Task 1/4.
- Placeholders: нет TBD; kong-шаблон отрендерен скриптом (Task 1 Step 3), nginx-HTTPS — envsubst-шаблон (Task 4).
- Type consistency: имена сервисов (`front`, `kong`, `supabase-db`, `supabase-cli`, `supabase-edge`) одинаковы во всех tasks; контракт `VITE_SUPABASE_URL=https://<домен>/sb` сквозной.
