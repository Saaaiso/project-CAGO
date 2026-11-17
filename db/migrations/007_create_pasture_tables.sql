CREATE TABLE pasture.pasture_unit (
    id                  uuid PRIMARY KEY,
    parcel_id           uuid REFERENCES land.parcel(id),
    admin_unit_id       uuid NOT NULL REFERENCES org.admin_unit(id),
    committee_org_id    uuid REFERENCES org.organization(id),
    name                jsonb NOT NULL,
    season              text NOT NULL CHECK (
        season IN ('winter', 'spring', 'summer', 'autumn', 'all_year')
    ),
    area_ha             numeric(12,4) NOT NULL CHECK (area_ha >= 0),
    carrying_capacity_su numeric(10,2) CHECK (carrying_capacity_su >= 0),
    geom                geometry(MultiPolygon, 4326) NOT NULL,
    is_deleted          boolean NOT NULL DEFAULT false
);

CREATE INDEX ix_pasture_unit_geom
    ON pasture.pasture_unit USING gist (geom);
CREATE INDEX ix_pasture_unit_admin_unit
    ON pasture.pasture_unit (admin_unit_id);

CREATE TABLE pasture.herd (
    id                uuid PRIMARY KEY,
    owner_subject_id  uuid NOT NULL REFERENCES land.subject(id),
    livestock_type_id smallint NOT NULL REFERENCES ref.livestock_type(id),
    head_count        integer NOT NULL CHECK (head_count >= 0),
    as_of             date NOT NULL
);

CREATE INDEX ix_herd_owner_subject_id ON pasture.herd (owner_subject_id);

CREATE TABLE pasture.pasture_plan (
    id              uuid PRIMARY KEY,
    pasture_unit_id uuid NOT NULL REFERENCES pasture.pasture_unit(id),
    year            smallint NOT NULL,
    status          text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft', 'approved', 'closed')),
    approved_by     uuid,
    approved_at     timestamptz,
    UNIQUE (pasture_unit_id, year)
);

CREATE TABLE pasture.pasture_plan_item (
    id         uuid PRIMARY KEY,
    plan_id    uuid NOT NULL REFERENCES pasture.pasture_plan(id) ON DELETE CASCADE,
    herd_id    uuid NOT NULL REFERENCES pasture.herd(id),
    period     daterange NOT NULL,
    head_count integer NOT NULL CHECK (head_count >= 0)
);
