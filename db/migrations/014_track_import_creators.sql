ALTER TABLE platform.job
    RENAME COLUMN requested_by TO created_by;

ALTER TABLE platform.import_batch
    ADD COLUMN created_by uuid,
    ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
