SET TimeZone = 'UTC';
-- Today = midnight UTC today (always within 24h and on today's bucket); 3d = three days ago, 01:00 UTC.
INSERT INTO users (ref, access_key_id, name, email, email_verified, password_digest, password_hash, created_at) VALUES
  ('u1', 'US1', 'u1', 'u1@example.com', true,  'scrypt$x', NULL, now() - interval '30 days'),          -- password, verified, old
  ('u2', 'US2', 'u2', 'u2@example.com', true,  NULL,       NULL, date_trunc('day', now())),            -- github, today
  ('u3', 'US3', 'u3', 'u3@example.com', false, 'scrypt$x', NULL, date_trunc('day', now())),            -- password, unverified, today
  ('u4', 'US4', 'u4', 'u4@example.com', true,  NULL,       NULL, date_trunc('day', now()) - interval '3 days' + interval '1 hour'), -- github, 3d
  ('u5', 'US5', 'u5', 'u5@example.com', true,  'scrypt$x', NULL, date_trunc('day', now()) - interval '3 days' + interval '1 hour'), -- password, 3d
  ('u6', 'US6', 'u6', 'u6@example.com', false, NULL,       'legacy', now() - interval '20 days');      -- legacy password column only

INSERT INTO workspaces (ref, access_key_id, name, owner_ref, created_at) VALUES
  ('w1', 'A1', 'w1', 'u1', now() - interval '30 days'),
  ('w2', 'A2', 'w2', 'u1', date_trunc('day', now())),
  ('w3', 'A3', 'w3', 'u1', date_trunc('day', now()) - interval '3 days' + interval '1 hour'),
  ('w4', 'A4', 'w4', 'u1', date_trunc('day', now()) - interval '3 days' + interval '1 hour');
