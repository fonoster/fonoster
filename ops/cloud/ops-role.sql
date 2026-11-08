-- The read-only database role of the ops API (ops/cloud/README.md, Ops API). Run once by the admin,
-- with -v password=...; grants are per column on purpose: no table-wide grant, so those tables' other
-- columns, and api_keys, refresh_tokens, secrets and billing's stripe_*, stay out of reach.
CREATE ROLE fonoster_ops LOGIN PASSWORD :'password' CONNECTION LIMIT 8;
\connect fnidentity
GRANT SELECT (ref, email_verified, password_digest, password_hash, created_at) ON users TO fonoster_ops;
GRANT SELECT (access_key_id, created_at) ON workspaces TO fonoster_ops;
\connect fonoster
GRANT SELECT (type, created_at) ON applications TO fonoster_ops;
GRANT SELECT (call_ref, access_key_id, started_at, duration_seconds, direction, status) ON call_records TO fonoster_ops;
\connect routr
GRANT SELECT (created_at) ON agents, numbers, trunks, domains TO fonoster_ops;
\connect billing
GRANT SELECT (plan, status) ON billing_accounts TO fonoster_ops;
GRANT SELECT (id, account_id, kind, bucket, amount_milli, grant_id, source, created_at) ON balance_ledger TO fonoster_ops;
