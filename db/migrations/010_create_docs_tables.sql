CREATE TABLE docs.file_object (
    id          uuid PRIMARY KEY,
    bucket      text NOT NULL,
    object_key  text NOT NULL,
    file_name   text NOT NULL,
    mime        text NOT NULL,
    size_bytes  bigint NOT NULL CHECK (size_bytes >= 0),
    sha256      char(64) NOT NULL,
    scan_status text NOT NULL DEFAULT 'pending'
                CHECK (scan_status IN ('pending', 'clean', 'infected')),
    uploaded_by uuid,
    uploaded_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (bucket, object_key)
);

CREATE TABLE docs.parcel_document (
    parcel_id   uuid NOT NULL REFERENCES land.parcel(id),
    file_id     uuid NOT NULL REFERENCES docs.file_object(id),
    doc_type_id smallint NOT NULL REFERENCES ref.doc_type(id),
    PRIMARY KEY (parcel_id, file_id)
);
