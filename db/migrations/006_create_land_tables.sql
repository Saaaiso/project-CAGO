CREATE TABLE land.subject (
    id          uuid PRIMARY KEY,
    type        text NOT NULL CHECK (
        type IN ('person', 'legal_entity', 'community', 'state')
    ),
    full_name   text NOT NULL,
    tax_id      text,
    doc_number  text,
    contacts    jsonb,
    is_deleted  boolean NOT NULL DEFAULT false
);

CREATE INDEX ix_subject_full_name_trgm
    ON land.subject USING gin (full_name gin_trgm_ops);
CREATE UNIQUE INDEX ux_subject_tax_id
    ON land.subject (tax_id) WHERE tax_id IS NOT NULL;

CREATE TABLE land.parcel (
    id               uuid PRIMARY KEY,
    cadastral_number text UNIQUE,
    admin_unit_id    uuid NOT NULL REFERENCES org.admin_unit(id),
    category_id      smallint NOT NULL REFERENCES ref.land_category(id),
    geom             geometry(MultiPolygon, 4326) NOT NULL
                     CHECK (ST_IsValid(geom)),
    area_ha          numeric(12,4) NOT NULL CHECK (area_ha >= 0),
    status           text NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'archived', 'disputed', 'draft')),
    attrs            jsonb NOT NULL DEFAULT '{}'::jsonb,
    valid_from       timestamptz NOT NULL DEFAULT now(),
    version          integer NOT NULL DEFAULT 1 CHECK (version > 0),
    is_deleted       boolean NOT NULL DEFAULT false,
    created_by       uuid,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX parcel_geom_gix ON land.parcel USING gist (geom);
CREATE INDEX ix_parcel_admin_category
    ON land.parcel (admin_unit_id, category_id) WHERE NOT is_deleted;
CREATE INDEX ix_parcel_attrs ON land.parcel USING gin (attrs jsonb_path_ops);

CREATE TABLE land.parcel_version (
    parcel_id  uuid NOT NULL REFERENCES land.parcel(id),
    version    integer NOT NULL,
    valid_from timestamptz NOT NULL,
    valid_to   timestamptz,
    geom       geometry(MultiPolygon, 4326) NOT NULL,
    snapshot   jsonb NOT NULL,
    changed_by uuid,
    PRIMARY KEY (parcel_id, version),
    CHECK (valid_to IS NULL OR valid_to > valid_from)
);

CREATE TABLE land.parcel_right (
    id            uuid PRIMARY KEY,
    parcel_id     uuid NOT NULL REFERENCES land.parcel(id),
    subject_id    uuid NOT NULL REFERENCES land.subject(id),
    right_type_id smallint NOT NULL REFERENCES ref.right_type(id),
    share         numeric(5,4) NOT NULL DEFAULT 1
                  CHECK (share > 0 AND share <= 1),
    period        daterange NOT NULL,
    doc_ref       text,
    EXCLUDE USING gist (
        parcel_id WITH =,
        subject_id WITH =,
        right_type_id WITH =,
        period WITH &&
    )
);

CREATE INDEX ix_parcel_right_parcel_id ON land.parcel_right (parcel_id);
CREATE INDEX ix_parcel_right_subject_id ON land.parcel_right (subject_id);
