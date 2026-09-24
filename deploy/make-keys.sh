#!/bin/sh
# Генерация ключей self-host Supabase (HS256 JWT), принцип из supabase/config
# в dev-стеке CLI: iss supabase-demo, 10 лет.
# Использование: deploy/make-keys.sh <JWT_SECRET> > keys.txt
set -eu

secret="${1:?Hyжен JWT_SECRET (openssl rand -hex 32)}"
now=$(date +%s)
exp=$((now + 10 * 365 * 24 * 3600))
b64url() { base64 | tr '+/' '-_' | tr -d '='; }

for role in anon service_role; do
  header=$(printf '{"alg":"HS256","typ":"JWT"}' | b64url | tr -d '\n')
  payload=$(printf '{"role":"%s","iss":"supabase-demo","iat":%s,"exp":%s}' \
    "$role" "$now" "$exp" | b64url | tr -d '\n')
  sig=$(printf '%s.%s' "$header" "$payload" \
    | openssl dgst -sha256 -hmac "$secret" -binary | b64url | tr -d '\n')
  printf 'keyauth %s key: %s\n' "$role" "$header.$payload.$sig"
done
