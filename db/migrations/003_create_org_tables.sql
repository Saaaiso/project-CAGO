CREATE TABLE org.admin_unit (
    id           uuid PRIMARY KEY,
    parent_id    uuid REFERENCES org.admin_unit(id),
    level        smallint NOT NULL CHECK (level BETWEEN 0 AND 4),
    code         text NOT NULL,
    name         jsonb NOT NULL,
    path         ltree NOT NULL,
    geom         geometry(MultiPolygon, 4326),
    country_code char(2) NOT NULL,
    is_deleted   boolean NOT NULL DEFAULT false,
    UNIQUE (country_code, code)
);

CREATE INDEX ix_admin_unit_path ON org.admin_unit USING gist (path);
CREATE INDEX ix_admin_unit_geom ON org.admin_unit USING gist (geom);
CREATE INDEX ix_admin_unit_parent_id ON org.admin_unit (parent_id);

CREATE TABLE org.organization (
    id            uuid PRIMARY KEY,
    admin_unit_id uuid NOT NULL REFERENCES org.admin_unit(id),
    type          text NOT NULL CHECK (
        type IN (
            'aiyl_okmotu',
            'pasture_committee',
            'district_office',
            'ministry',
            'other'
        )
    ),
    name          jsonb NOT NULL,
    contacts      jsonb,
    is_deleted    boolean NOT NULL DEFAULT false
);

CREATE INDEX ix_organization_admin_unit_type
    ON org.organization (admin_unit_id, type);
