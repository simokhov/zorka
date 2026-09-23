#!/bin/sh
# Рендер kong.yml из env (Kong не подставляет env в declarative config),
# затем запуск kong в Docker-режиме (как в оригинальном docker-entrypoint).
set -eu

: "${ANON_KEY:?ANON_KEY обязателен}"
: "${SERVICE_KEY:?SERVICE_KEY обязателен}"

sed -e "s|\${ANON_KEY}|${ANON_KEY}|" -e "s|\${SERVICE_KEY}|${SERVICE_KEY}|" \
  /templates/kong.yml.tmpl > /usr/local/kong/kong.yml

exec /docker-entrypoint.sh kong docker-start
