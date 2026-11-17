ALTER TABLE iam."user"
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE org.admin_unit
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE org.organization
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE land.subject
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE land.parcel
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE land.parcel_right
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE pasture.pasture_unit
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE pasture.herd
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE pasture.pasture_plan
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE pasture.pasture_plan_item
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE crop.crop_declaration
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE monitoring.satellite_scene
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE monitoring.alert
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE docs.file_object
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE platform.job
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE platform.import_batch
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE land.parcel
    DROP CONSTRAINT parcel_cadastral_number_key;

CREATE UNIQUE INDEX ux_parcel_cadastral_number_active
    ON land.parcel (cadastral_number)
    WHERE cadastral_number IS NOT NULL AND NOT is_deleted;

DROP INDEX land.ux_subject_tax_id;

CREATE UNIQUE INDEX ux_subject_tax_id_active
    ON land.subject (tax_id)
    WHERE tax_id IS NOT NULL AND NOT is_deleted;

ALTER TABLE monitoring.alert
    ADD CONSTRAINT ck_alert_rule_code
    CHECK (rule_code IN ('ndvi_drop', 'overgrazing', 'abandoned'));

ALTER TABLE pasture.pasture_unit
    RENAME COLUMN season TO use_season;

ALTER TABLE pasture.pasture_unit
    RENAME CONSTRAINT pasture_unit_season_check TO ck_pasture_unit_use_season;

CREATE FUNCTION platform.set_area_ha_from_geom()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.area_ha := round((ST_Area(NEW.geom::geography) / 10000)::numeric, 4);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_parcel_area_from_geom
    BEFORE INSERT OR UPDATE OF geom, area_ha
    ON land.parcel
    FOR EACH ROW
    EXECUTE FUNCTION platform.set_area_ha_from_geom();

CREATE TRIGGER trg_pasture_unit_area_from_geom
    BEFORE INSERT OR UPDATE OF geom, area_ha
    ON pasture.pasture_unit
    FOR EACH ROW
    EXECUTE FUNCTION platform.set_area_ha_from_geom();

CREATE FUNCTION crop.validate_declaration_area()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    parcel_area numeric(12,4);
BEGIN
    SELECT p.area_ha
      INTO parcel_area
      FROM land.parcel AS p
     WHERE p.id = NEW.parcel_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Parcel % does not exist', NEW.parcel_id
            USING ERRCODE = '23503';
    END IF;

    IF NEW.area_ha > parcel_area THEN
        RAISE EXCEPTION 'Declared crop area % exceeds parcel area % for parcel %',
            NEW.area_ha, parcel_area, NEW.parcel_id
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_crop_declaration_area_check
    BEFORE INSERT OR UPDATE OF parcel_id, area_ha
    ON crop.crop_declaration
    FOR EACH ROW
    EXECUTE FUNCTION crop.validate_declaration_area();

CREATE FUNCTION land.validate_parcel_declaration_areas()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM crop.crop_declaration AS d
         WHERE d.parcel_id = NEW.id
           AND d.area_ha > NEW.area_ha
    ) THEN
        RAISE EXCEPTION 'Parcel area % is smaller than a crop declaration for parcel %',
            NEW.area_ha, NEW.id
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_parcel_crop_area_guard
    BEFORE UPDATE OF geom, area_ha
    ON land.parcel
    FOR EACH ROW
    EXECUTE FUNCTION land.validate_parcel_declaration_areas();

UPDATE land.parcel
   SET area_ha = round((ST_Area(geom::geography) / 10000)::numeric, 4);

UPDATE pasture.pasture_unit
   SET area_ha = round((ST_Area(geom::geography) / 10000)::numeric, 4);

CREATE FUNCTION platform.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DO $$
DECLARE
    target record;
BEGIN
    FOR target IN
        SELECT c.table_schema, c.table_name
          FROM information_schema.columns AS c
          JOIN information_schema.tables AS t
            ON t.table_schema = c.table_schema
           AND t.table_name = c.table_name
         WHERE c.column_name = 'updated_at'
           AND t.table_type = 'BASE TABLE'
           AND c.table_schema NOT IN ('pg_catalog', 'information_schema')
    LOOP
        EXECUTE format(
            'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I.%I '
            'FOR EACH ROW EXECUTE FUNCTION platform.set_updated_at()',
            target.table_schema,
            target.table_name
        );
    END LOOP;
END;
$$;
