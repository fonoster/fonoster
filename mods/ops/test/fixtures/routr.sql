SET TimeZone = 'UTC';
-- Kept whole: Routr's schema isn't in this repository.
CREATE TABLE agents  (ref text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE numbers (ref text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE trunks  (ref text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE domains (ref text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
INSERT INTO agents  VALUES ('g1', now() - interval '30 days'), ('g2', now() - interval '30 days'), ('g3', now() - interval '1 day');
INSERT INTO numbers VALUES ('n1', now() - interval '2 days'), ('n2', now() - interval '40 days');
INSERT INTO trunks  VALUES ('t1', now() - interval '60 days');
INSERT INTO domains VALUES ('d1', now() - interval '60 days'), ('d2', now() - interval '10 days');
