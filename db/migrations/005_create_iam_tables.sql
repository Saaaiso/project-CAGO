CREATE TABLE iam."user" (
    id               uuid PRIMARY KEY,
    organization_id  uuid REFERENCES org.organization(id),
    login            citext NOT NULL UNIQUE,
    email            citext,
    phone            text,
    full_name        text NOT NULL,
    password_hash    text,
    external_subject text UNIQUE,
    locale           text NOT NULL DEFAULT 'ru',
    is_active        boolean NOT NULL DEFAULT true,
    last_login_at    timestamptz,
    created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE iam.role (
    id   smallint PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name jsonb NOT NULL
);

CREATE TABLE iam.user_role_scope (
    user_id       uuid NOT NULL REFERENCES iam."user"(id),
    role_id       smallint NOT NULL REFERENCES iam.role(id),
    admin_unit_id uuid NOT NULL REFERENCES org.admin_unit(id),
    PRIMARY KEY (user_id, role_id, admin_unit_id)
);
