CREATE TABLE crop.season (
    id     smallint PRIMARY KEY,
    year   smallint NOT NULL,
    code   text NOT NULL,
    period daterange NOT NULL,
    UNIQUE (year, code)
);

CREATE TABLE crop.crop_declaration (
    id          uuid PRIMARY KEY,
    parcel_id   uuid NOT NULL REFERENCES land.parcel(id),
    season_id   smallint NOT NULL REFERENCES crop.season(id),
    crop_id     smallint NOT NULL REFERENCES ref.crop(id),
    area_ha     numeric(12,4) NOT NULL CHECK (area_ha >= 0),
    sowing_date date,
    harvest_date date,
    yield_t_ha  numeric(8,3),
    declared_by uuid,
    UNIQUE (parcel_id, season_id, crop_id),
    CHECK (
        sowing_date IS NULL OR harvest_date IS NULL OR harvest_date >= sowing_date
    )
);
