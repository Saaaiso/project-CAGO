CREATE TABLE ref.land_category (
    id   smallint PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name jsonb NOT NULL
);

CREATE TABLE ref.right_type (
    id   smallint PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name jsonb NOT NULL
);

CREATE TABLE ref.crop (
    id   smallint PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name jsonb NOT NULL
);

CREATE TABLE ref.livestock_type (
    id                smallint PRIMARY KEY,
    code              text NOT NULL UNIQUE,
    name              jsonb NOT NULL,
    sheep_unit_factor numeric(5,2) NOT NULL CHECK (sheep_unit_factor > 0)
);

CREATE TABLE ref.doc_type (
    id   smallint PRIMARY KEY,
    code text NOT NULL UNIQUE,
    name jsonb NOT NULL
);
