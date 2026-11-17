CREATE TABLE platform.outbox (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    aggregate    text NOT NULL,
    aggregate_id uuid,
    type         text NOT NULL,
    payload      jsonb NOT NULL,
    created_at   timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz
);

CREATE INDEX ix_outbox_unpublished
    ON platform.outbox (id) WHERE published_at IS NULL;

CREATE TABLE platform.job (
    id           uuid PRIMARY KEY,
    type         text NOT NULL,
    status       text NOT NULL DEFAULT 'queued'
                 CHECK (status IN ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
    params       jsonb NOT NULL,
    result       jsonb,
    attempts     integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    requested_by uuid,
    created_at   timestamptz NOT NULL DEFAULT now(),
    started_at   timestamptz,
    finished_at  timestamptz
);

CREATE TABLE platform.import_batch (
    id         uuid PRIMARY KEY,
    job_id     uuid REFERENCES platform.job(id),
    file_id    uuid REFERENCES docs.file_object(id),
    kind       text NOT NULL,
    total_rows integer CHECK (total_rows >= 0),
    ok_rows    integer CHECK (ok_rows >= 0),
    error_rows integer CHECK (error_rows >= 0)
);
