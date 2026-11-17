CREATE TABLE monitoring.satellite_scene (
    id             uuid PRIMARY KEY,
    provider       text NOT NULL,
    external_id    text NOT NULL,
    acquired_at    timestamptz NOT NULL,
    cloud_cover    numeric(5,2) CHECK (cloud_cover BETWEEN 0 AND 100),
    footprint      geometry(Polygon, 4326),
    cog_object_key text,
    status         text NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new', 'downloaded', 'processed', 'failed')),
    UNIQUE (provider, external_id)
);

CREATE INDEX ix_satellite_scene_footprint
    ON monitoring.satellite_scene USING gist (footprint);
CREATE INDEX ix_satellite_scene_acquired_at
    ON monitoring.satellite_scene (acquired_at);

-- MVP uses a regular table so observations for any date can be inserted.
-- Add partitioning later through a separately planned migration.
CREATE TABLE monitoring.parcel_observation (
    parcel_id         uuid NOT NULL,
    observed_on       date NOT NULL,
    scene_id          uuid NOT NULL REFERENCES monitoring.satellite_scene(id),
    ndvi_mean         real,
    ndvi_min          real,
    ndvi_max          real,
    ndvi_std          real,
    valid_pixel_share real CHECK (valid_pixel_share BETWEEN 0 AND 1),
    PRIMARY KEY (parcel_id, observed_on, scene_id)
);

CREATE INDEX ix_parcel_observation_observed_on
    ON monitoring.parcel_observation (observed_on);

CREATE TABLE monitoring.alert_rule (
    id        uuid PRIMARY KEY,
    code      text NOT NULL UNIQUE,
    params    jsonb NOT NULL,
    is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE monitoring.alert (
    id            uuid PRIMARY KEY,
    rule_id       uuid NOT NULL REFERENCES monitoring.alert_rule(id),
    parcel_id     uuid NOT NULL,
    admin_unit_id uuid NOT NULL,
    severity      text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    raised_at     timestamptz NOT NULL DEFAULT now(),
    status        text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'ack', 'resolved')),
    payload       jsonb
);

CREATE INDEX ix_alert_admin_status_raised
    ON monitoring.alert (admin_unit_id, status, raised_at DESC);
