-- Synthetic development fixtures only. The user has no password and cannot
-- authenticate unless a development OIDC provider issues the matching subject.
BEGIN;

INSERT INTO org.admin_unit
    (id, parent_id, level, code, name, path, country_code)
VALUES
    ('00000000-0000-7000-8000-000000000001', NULL, 0, 'KG',
     '{"ru":"Тестовая страна","ky":"Тесттик өлкө"}',
     'u_00000000000070008000000000000001', 'KG'),
    ('00000000-0000-7000-8000-000000000002', '00000000-0000-7000-8000-000000000001',
     1, 'TEST-REGION', '{"ru":"Тестовая область"}',
     'u_00000000000070008000000000000001.u_00000000000070008000000000000002', 'KG'),
    ('00000000-0000-7000-8000-000000000003', '00000000-0000-7000-8000-000000000002',
     2, 'TEST-DISTRICT', '{"ru":"Тестовый район"}',
     'u_00000000000070008000000000000001.u_00000000000070008000000000000002.u_00000000000070008000000000000003', 'KG'),
    ('00000000-0000-7000-8000-000000000004', '00000000-0000-7000-8000-000000000003',
     3, 'A42', '{"ru":"Тестовый айыл окмоту"}',
     'u_00000000000070008000000000000001.u_00000000000070008000000000000002.u_00000000000070008000000000000003.u_00000000000070008000000000000004', 'KG')
ON CONFLICT (id) DO NOTHING;

INSERT INTO org.organization (id, admin_unit_id, type, name)
VALUES (
    '00000000-0000-7000-8000-000000000101',
    '00000000-0000-7000-8000-000000000004',
    'aiyl_okmotu',
    '{"ru":"Тестовая администрация A42"}'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ref.land_category (id, code, name)
VALUES (1, 'arable', '{"ru":"Пашня","ky":"Айдоо жер"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ref.right_type (id, code, name)
VALUES (1, 'ownership', '{"ru":"Собственность"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ref.crop (id, code, name)
VALUES (1, 'wheat', '{"ru":"Пшеница"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO ref.livestock_type (id, code, name, sheep_unit_factor)
VALUES (1, 'sheep', '{"ru":"Овца"}', 1.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ref.doc_type (id, code, name)
VALUES (1, 'ownership_document', '{"ru":"Документ о праве"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO iam.role (id, code, name)
VALUES
    (10, 'system_admin', '{"ru":"Системный администратор"}'),
    (20, 'aiyl_specialist', '{"ru":"Специалист айыл окмоту"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO iam."user" (
    id, organization_id, login, email, full_name, external_subject
)
VALUES (
    '00000000-0000-7000-8000-000000000201',
    '00000000-0000-7000-8000-000000000101',
    'dev.specialist',
    'dev.specialist@example.test',
    'Тестовый специалист',
    'dev-oidc-subject-001'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO iam."user" (
    id, organization_id, login, email, full_name, external_subject
)
VALUES (
    '00000000-0000-7000-8000-000000000202',
    NULL,
    'dev.admin',
    'dev.admin@example.test',
    'Тестовый системный администратор',
    'dev-oidc-subject-002'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO iam.user_role_scope (user_id, role_id, admin_unit_id)
VALUES (
    '00000000-0000-7000-8000-000000000201',
    20,
    '00000000-0000-7000-8000-000000000004'
)
ON CONFLICT (user_id, role_id, admin_unit_id) DO NOTHING;

INSERT INTO iam.user_role_scope (user_id, role_id, admin_unit_id)
VALUES (
    '00000000-0000-7000-8000-000000000202',
    10,
    '00000000-0000-7000-8000-000000000001'
)
ON CONFLICT (user_id, role_id, admin_unit_id) DO NOTHING;

INSERT INTO land.subject (id, type, full_name)
VALUES (
    '00000000-0000-7000-8000-000000000301',
    'community',
    'Тестовое сообщество'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO land.parcel (
    id, cadastral_number, admin_unit_id, category_id, geom, area_ha, created_by
)
VALUES (
    '00000000-0000-7000-8000-000000000401',
    'DEV-A42-0001',
    '00000000-0000-7000-8000-000000000004',
    1,
    ST_Multi(ST_GeomFromText(
        'POLYGON((74.50 42.80, 74.51 42.80, 74.51 42.81, 74.50 42.81, 74.50 42.80))',
        4326
    )),
    90.00,
    '00000000-0000-7000-8000-000000000201'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO land.parcel_right (
    id, parcel_id, subject_id, right_type_id, share, period, doc_ref
)
VALUES (
    '00000000-0000-7000-8000-000000000501',
    '00000000-0000-7000-8000-000000000401',
    '00000000-0000-7000-8000-000000000301',
    1,
    1.0000,
    daterange('2020-01-01', NULL, '[)'),
    'DEV-DOC-0001'
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
