-- Alert rules are fixed in the Backend for MVP; retain the rule code on alerts.
ALTER TABLE monitoring.alert
    ADD COLUMN rule_code text;

UPDATE monitoring.alert AS a
SET rule_code = r.code
FROM monitoring.alert_rule AS r
WHERE r.id = a.rule_id;

ALTER TABLE monitoring.alert
    ALTER COLUMN rule_code SET NOT NULL;

ALTER TABLE monitoring.alert
    DROP CONSTRAINT alert_rule_id_fkey;

ALTER TABLE monitoring.alert
    DROP COLUMN rule_id;

DROP TABLE monitoring.alert_rule;

-- These tables are not partitioned in MVP, so physical parcel FKs are appropriate.
ALTER TABLE monitoring.parcel_observation
    ADD CONSTRAINT fk_parcel_observation_parcel
    FOREIGN KEY (parcel_id) REFERENCES land.parcel(id);

ALTER TABLE monitoring.alert
    ADD CONSTRAINT fk_alert_parcel
    FOREIGN KEY (parcel_id) REFERENCES land.parcel(id),
    ADD CONSTRAINT fk_alert_admin_unit
    FOREIGN KEY (admin_unit_id) REFERENCES org.admin_unit(id);
