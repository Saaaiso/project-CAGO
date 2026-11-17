-- MVP audit table is not partitioned; partitioning can be added when justified by volume.
CREATE TABLE audit.change_log (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    at            timestamptz NOT NULL DEFAULT now(),
    actor_id      uuid,
    action        text NOT NULL,
    entity        text NOT NULL,
    entity_id     uuid,
    admin_unit_id uuid,
    diff          jsonb,
    ip            inet
);

CREATE INDEX ix_change_log_at ON audit.change_log (at DESC);
CREATE INDEX ix_change_log_entity ON audit.change_log (entity, entity_id, at DESC);
