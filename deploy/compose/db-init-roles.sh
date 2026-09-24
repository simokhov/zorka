# Сервисные роли Supabase в образе supabase/postgres инициализируются с известными
# дефолтными паролями; приводим их к POSTGRES_PASSWORD, на который ориентируются
# остальные сервисы compose (см. docker-compose.yml).
# Файл sourced официальным docker-entrypoint.sh постгрес-образа (initdb.d).
docker_process_sql -v ON_ERROR_STOP=1 <<SQL
ALTER ROLE supabase_auth_admin WITH PASSWORD '${POSTGRES_PASSWORD}';
ALTER ROLE supabase_storage_admin WITH PASSWORD '${POSTGRES_PASSWORD}';
ALTER ROLE authenticator WITH PASSWORD '${POSTGRES_PASSWORD}';
ALTER ROLE supabase_admin WITH PASSWORD '${POSTGRES_PASSWORD}';
SQL
