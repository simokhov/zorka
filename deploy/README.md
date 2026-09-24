# Деплой Зорьки на VM Яндекс.Облака

Одна VM: nginx (`front`) — статика бандла + прокси `/sb/` → kong → self-host
Supabase (auth, rest, storage, edge). CD из `main` — `.github/workflows/cd.yml`.

## 1. Что поднимает compose

`deploy/compose/docker-compose.yml` (имя сервиса deploy-стека — `zorka`):

| Сервис | Роль | Порты хоста |
|---|---|---|
| `front` (nginx:1.27-alpine) | статика `/opt/zorka/current` + `/sb/` → kong | 80, 443 |
| `kong` (2.8.1) | роутер Supabase (kong.yml из шаблона) | 127.0.0.1:8000 |
| `supabase-db` | Postgres 15 (supabase/postgres) | 127.0.0.1:5432 (для миграций по туннелю) |
| `supabase-auth` (gotrue) | auth | внутр. 9999 |
| `supabase-rest` (postgrest) | REST | внутр. 3000 |
| `supabase-storage` | файлы поимок, bucket `catch-photos` | внутр. 5000 |
| `supabase-edge` | Edge Function get-weather | внутр. 8081 |
| `supabase-cli` (tools profile) | разовые операции | — |

БД-инициализация: `deploy/compose/db-init-roles.sh` при первом старте свежего
тома приводит пароли сервисных ролей к `POSTGRES_PASSWORD` (в образе
supabase/postgres они инициализируются дефолтными).

## 2. Первичная настройка VM (один раз)

```bash
# От root на VM (Ubuntu 24.04, 1 vCPU / 2 GB — см. спеку CD §3):
apt update && apt install -y docker.io rsync
useradd -m -s /bin/bash deploy
usermod -aG docker deploy
mkdir -p /opt/zorka/compose /opt/zorka/releases /opt/zorka/current \
         /opt/zorka/functions /opt/zorka/migrations
chown -R deploy:deploy /opt/zorka

# Свитч на root же (руки CD-джоба):
#   docker compose -p zorka ... (права docker уже даны deploy)
```

Дальше под `deploy`:

```bash
cd /opt/zorka/compose
# скопировать deploy/compose/* сюда; заполнить .env (ниже):
cp .env.example .env
editor .env
```

`.env` — пример в `deploy/compose/.env.example`. Генерация секретов:

```bash
JWT_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 32)
# ANON/SERVICE — JWT-подобные ключи (10 лет), см. ниже
```

Генерация ANON_KEY/SERVICE_KEY (HS256, роль внутри payload):

```bash
bash deploy/make-keys.sh "$JWT_SECRET"   # выдаёт оба ключа
```

Секреты пишутся ТОЛЬКО в `/opt/zorka/compose/.env` на VM и в GitHub secret
`POSTGRES_PASSWORD` (для миграций) — не в репозиторий:

| Переменная | Описание |
|---|---|
| POSTGRES_PASSWORD | `openssl rand -hex 32` |
| JWT_SECRET | `(openssl rand -hex 32)` |
| ANON_KEY | вывод `deploy/make-keys.sh` (anon) |
| SERVICE_KEY | вывод `deploy/make-keys.sh` (service_role) |
| SITE_URL | `https://<домен>` (в HTTP-фазе — `http://<IP>`) |
| OWM_API_KEY | ключ openweathermap.org (бесплатный тариф), может быть пустым — get-weather вернёт ошибку |

Compose-стек:

```bash
docker compose -p zorka -f docker-compose.yml --env-file .env up -d
```

### GitHub secrets (Settings → Secrets → Actions)

- `VM_HOST` — IP или домен VM;
- `VM_SSH_KEY` — приватный ключ (`ssh-keygen -t ed25519`), публичная половина —
  в `/home/deploy/.ssh/authorized_keys`;
- `VITE_SUPABASE_PUBLISHABLE_KEY` — тот же ANON_KEY (клиентский ключ);
- `POSTGRES_PASSWORD` — для шага миграций.

Скелет homes каталога для rsync создаётся при первом прогоне CD (релиз,
migrations, functions), либо руками `mkdir -p`.

## 3. TLS

Сертификат выпускается до переключения health-check на HTTPS:

```bash
apt install -y certbot
certbot certonly --webroot -w /var/www/certbot -d ${DOMAIN}
envsubst '$DOMAIN' < nginx.https.conf.tmpl >> nginx.conf
docker compose -p zorka --env-file .env restart front
```

Затем в `.github/workflows/cd.yml` шаг health-check переключить на `https://` —
см. комментарий в workflow.

## 4. Рольбэк

```bash
ls -1dt /opt/zorka/releases/* | head -3   # последние 3 релиза
ln -sfn /opt/zorka/releases/<sha> /opt/zorka/current
docker compose -p zorka --env-file .env up -d front
```

Миграции обратного отката не требуют: schema-only, push идемпотентен.

## 5. Локальная проверка стека

```bash
cd deploy/compose
docker compose -p zorka-local --env-file .env \
  -f docker-compose.yml -f docker-compose.local.yml up -d
# миграции с хоста:
pnpm dlx supabase@2 db push \
  --db-url "postgres://supabase_admin:${POSTGRES_PASSWORD}@127.0.0.1:54329/postgres?sslmode=disable"
# health-check: localhost:8180/, /sb/auth/v1/health, /sb/rest/v1/species, /sb/functions/v1/get-weather
```

`docker-compose.local.yml` — отладочные привязки портов/томов поверх прод
compose'а; имя проекта `zorka-local`, чтобы не конфликтовать с dev-стеком CLI
(`supabase start`, тоже использует имя `zorka`).

## 6. Известные ограничения

- Почта подтверждения (SMTP) — не настроена: `MAILER_AUTOCONFIRM=true`
  (см. docker-compose.yml), включить вместе с SMTP.
- Kong плагины: bundled + request-size-limiting; `cors` добавлен глобально
  (origins `*`) под `/sb/<service>/v1/*` — при появлении сторонних доменов
  сузить.
- Cloudflare/прод-домены: `SITE_URL` и `API_EXTERNAL_URL` должны совпадать с
  фактическим URL front (иначе auth redirect вернёт 403).
