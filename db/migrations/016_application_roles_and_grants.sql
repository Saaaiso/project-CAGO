CREATE ROLE app_rw
    NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;

CREATE ROLE worker_rw
    NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;

CREATE ROLE report_ro
    NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;

DO $$
BEGIN
    EXECUTE format(
        'GRANT CONNECT ON DATABASE %I TO app_rw, worker_rw, report_ro',
        current_database()
    );
END;
$$;

GRANT USAGE ON SCHEMA
    org, iam, land, pasture, crop, monitoring, docs, platform, ref, audit
TO app_rw;

GRANT SELECT, INSERT, UPDATE, DELETE
    ON ALL TABLES IN SCHEMA org, iam, land, pasture, crop, monitoring, docs, platform
TO app_rw;

GRANT SELECT ON ALL TABLES IN SCHEMA ref TO app_rw;
GRANT INSERT ON ALL TABLES IN SCHEMA audit TO app_rw;

GRANT USAGE ON SCHEMA land, monitoring, platform TO worker_rw;

GRANT SELECT ON ALL TABLES IN SCHEMA land TO worker_rw;

GRANT SELECT, INSERT, UPDATE
    ON ALL TABLES IN SCHEMA monitoring, platform
TO worker_rw;

GRANT USAGE ON SCHEMA org, ref, land, pasture, crop, monitoring
TO report_ro;

GRANT SELECT
    ON ALL TABLES IN SCHEMA org, ref, land, pasture, crop, monitoring
TO report_ro;
