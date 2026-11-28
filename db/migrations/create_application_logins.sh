#!/bin/bash
set -euo pipefail

psql -v ON_ERROR_STOP=1 \
  -v app_user="$APP_DB_USER" \
  -v app_password="$APP_DB_PASSWORD" \
  -v worker_user="$WORKER_DB_USER" \
  -v worker_password="$WORKER_DB_PASSWORD" \
  -v report_user="$REPORT_DB_USER" \
  -v report_password="$REPORT_DB_PASSWORD" \
  --dbname="$POSTGRES_DB" \
  --username="$POSTGRES_USER" <<'SQL'
SELECT set_config('cago.app_user', :'app_user', false) AS app_user \gset
SELECT set_config('cago.app_password', :'app_password', false) AS app_password \gset
SELECT set_config('cago.worker_user', :'worker_user', false) AS worker_user \gset
SELECT set_config('cago.worker_password', :'worker_password', false) AS worker_password \gset
SELECT set_config('cago.report_user', :'report_user', false) AS report_user \gset
SELECT set_config('cago.report_password', :'report_password', false) AS report_password \gset

DO $$
DECLARE
    app_user text := current_setting('cago.app_user');
    app_password text := current_setting('cago.app_password');
    worker_user text := current_setting('cago.worker_user');
    worker_password text := current_setting('cago.worker_password');
    report_user text := current_setting('cago.report_user');
    report_password text := current_setting('cago.report_password');
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = app_user) THEN
        EXECUTE format(
            'CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L',
            app_user,
            app_password
        );
    ELSE
        EXECUTE format(
            'ALTER ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L',
            app_user,
            app_password
        );
    END IF;
    EXECUTE format('GRANT app_rw TO %I', app_user);

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = worker_user) THEN
        EXECUTE format(
            'CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L',
            worker_user,
            worker_password
        );
    ELSE
        EXECUTE format(
            'ALTER ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L',
            worker_user,
            worker_password
        );
    END IF;
    EXECUTE format('GRANT worker_rw TO %I', worker_user);

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = report_user) THEN
        EXECUTE format(
            'CREATE ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L',
            report_user,
            report_password
        );
    ELSE
        EXECUTE format(
            'ALTER ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD %L',
            report_user,
            report_password
        );
    END IF;
    EXECUTE format('GRANT report_ro TO %I', report_user);
END;
$$;
SQL
