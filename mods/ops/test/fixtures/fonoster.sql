SET TimeZone = 'UTC';
INSERT INTO applications (ref, access_key_id, name, type, endpoint, created_at) VALUES
  ('a1', 'A1', 'a1', 'AUTOPILOT', 'a1', now() - interval '30 days'),
  ('a2', 'A1', 'a2', 'AUTOPILOT', 'a2', now() - interval '30 days'),
  ('a3', 'A2', 'a3', 'AUTOPILOT', 'a3', date_trunc('day', now())),
  ('a4', 'A3', 'a4', 'STREAM',    'a4', date_trunc('day', now()) - interval '3 days' + interval '1 hour');

INSERT INTO call_records (call_ref, access_key_id, direction, status, started_at, duration_seconds, region, location, version, parts) VALUES
  ('c1', 'A3',  'inbound',  'completed', now() - interval '10 minutes', 120, 'r', 'l', 1, '{}'),
  ('c2', 'A1',  'outbound', 'completed', now() - interval '5 hours',     60, 'r', 'l', 1, '{}'),
  ('c3', 'A1',  'outbound', 'failed',    now() - interval '5 hours',      3, 'r', 'l', 1, '{}'),
  ('c4', 'A3',  'inbound',  'completed', now() - interval '3 days',     300, 'r', 'l', 1, '{}'),
  ('c5', 'A1',  'inbound',  'completed', now() - interval '20 days',    600, 'r', 'l', 1, '{}'),
  ('c6', NULL,  NULL,       'Erased',    now() - interval '2 hours',      0, 'r', 'l', 1, '{}');

-- More calls: A2 failed 3s and A4 completed 5s (both older than 24h) separate loose from strict activation.
INSERT INTO call_records (call_ref, access_key_id, direction, status, started_at, duration_seconds, region, location, version, parts) VALUES
  ('c7', 'A2', 'inbound', 'failed',    now() - interval '4 days', 3, 'r', 'l', 1, '{}'),
  ('c8', 'A4', 'inbound', 'completed', now() - interval '4 days', 5, 'r', 'l', 1, '{}');
