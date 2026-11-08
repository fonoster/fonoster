/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// The queries of a metrics snapshot, schema 1. Each column they read needs a grant in
// ops/cloud/ops-role.sql: grant a new one before a release's query reads it.

export const IDENTITY = `
SELECT json_build_object(
  'users', (SELECT json_build_object(
      'total', count(*),
      'verified', count(*) FILTER (WHERE email_verified),
      'password', count(*) FILTER (WHERE password_digest IS NOT NULL OR password_hash IS NOT NULL),
      'github', count(*) FILTER (WHERE password_digest IS NULL AND password_hash IS NULL),
      'new_24h', count(*) FILTER (WHERE created_at > now() - interval '24 hours'),
      'new_7d', count(*) FILTER (WHERE created_at > now() - interval '7 days'),
      'verified_new_24h', count(*) FILTER (WHERE email_verified AND created_at > now() - interval '24 hours'),
      'verified_new_7d', count(*) FILTER (WHERE email_verified AND created_at > now() - interval '7 days'))
    FROM users),
  'workspaces', (SELECT json_build_object(
      'total', count(*),
      'new_24h', count(*) FILTER (WHERE created_at > now() - interval '24 hours'),
      'new_7d', count(*) FILTER (WHERE created_at > now() - interval '7 days'))
    FROM workspaces),
  'daily', json_build_object(
    'signups', (SELECT json_agg(c ORDER BY d) FROM (
        SELECT days.d, count(u.ref) AS c
        FROM (SELECT ((now() AT TIME ZONE 'UTC')::date - 13 + i) AS d FROM generate_series(0, 13) AS i) days
        LEFT JOIN users u ON u.created_at::date = days.d
        GROUP BY days.d) s),
    'verified', (SELECT json_agg(c ORDER BY d) FROM (
        SELECT days.d, count(u.ref) AS c
        FROM (SELECT ((now() AT TIME ZONE 'UTC')::date - 13 + i) AS d FROM generate_series(0, 13) AS i) days
        LEFT JOIN users u ON u.created_at::date = days.d AND u.email_verified
        GROUP BY days.d) s))
) AS o`;

/** Key ids of workspaces created in the last 7 days (newest 5000), to count activation. */
export const NEW_WORKSPACES = `
SELECT coalesce(array_agg(access_key_id), '{}') AS o FROM (
  SELECT access_key_id FROM workspaces
  WHERE created_at > now() - interval '7 days'
  ORDER BY created_at DESC LIMIT 5000) w`;

/** $1: the key ids from NEW_WORKSPACES. */
export const FONOSTER = `
SELECT json_build_object(
  'apps', (SELECT json_build_object(
      'total', count(*),
      'autopilot', count(*) FILTER (WHERE type::text = 'AUTOPILOT'),
      'stream', count(*) FILTER (WHERE type::text = 'STREAM'),
      'new_7d', count(*) FILTER (WHERE created_at > now() - interval '7 days'))
    FROM applications),
  'calls', (SELECT json_build_object(
      'total', count(*),
      'h1', count(*) FILTER (WHERE started_at > now() - interval '1 hour'),
      'h24', count(*) FILTER (WHERE started_at > now() - interval '24 hours'),
      'd7', count(*) FILTER (WHERE started_at > now() - interval '7 days'),
      'minutes_24h', coalesce(round(sum(duration_seconds) FILTER (WHERE started_at > now() - interval '24 hours') / 60.0), 0)::bigint,
      'avg_secs_24h', coalesce(round(avg(duration_seconds) FILTER (WHERE started_at > now() - interval '24 hours')), 0)::bigint,
      'under5s_24h', count(*) FILTER (WHERE started_at > now() - interval '24 hours' AND duration_seconds < 5),
      'inbound_24h', count(*) FILTER (WHERE started_at > now() - interval '24 hours' AND direction = 'inbound'),
      'outbound_24h', count(*) FILTER (WHERE started_at > now() - interval '24 hours' AND direction = 'outbound'),
      'workspaces_24h', count(DISTINCT access_key_id) FILTER (WHERE started_at > now() - interval '24 hours'),
      'by_status_24h', (SELECT coalesce(json_object_agg(k, c), '{}'::json) FROM (
          SELECT left(coalesce(nullif(regexp_replace(lower(status), '[^a-z0-9]+', '_', 'g'), ''), 'unknown'), 32) AS k,
                 count(*) AS c
          FROM call_records
          WHERE started_at > now() - interval '24 hours'
          GROUP BY 1 ORDER BY 2 DESC LIMIT 16) s))
    FROM call_records),
  'active_7d', (SELECT count(DISTINCT access_key_id) FROM call_records
                WHERE started_at > now() - interval '7 days'),
  'activated_7d', (SELECT count(DISTINCT access_key_id) FROM call_records
                   WHERE access_key_id = ANY($1::text[])
                     AND status = 'completed' AND duration_seconds >= 10),
  'activated_loose_7d', (SELECT count(DISTINCT access_key_id) FROM call_records
                         WHERE access_key_id = ANY($1::text[])),
  'activated_total', (SELECT count(DISTINCT access_key_id) FROM call_records
                      WHERE status = 'completed' AND duration_seconds >= 10),
  'daily', json_build_object(
    'calls', (SELECT json_agg(c ORDER BY d) FROM (
        SELECT days.d, count(r.call_ref) AS c
        FROM (SELECT ((now() AT TIME ZONE 'UTC')::date - 13 + i) AS d FROM generate_series(0, 13) AS i) days
        LEFT JOIN call_records r ON r.started_at::date = days.d
        GROUP BY days.d) s),
    'minutes', (SELECT json_agg(c ORDER BY d) FROM (
        SELECT days.d, coalesce(round(sum(r.duration_seconds) / 60.0), 0)::bigint AS c
        FROM (SELECT ((now() AT TIME ZONE 'UTC')::date - 13 + i) AS d FROM generate_series(0, 13) AS i) days
        LEFT JOIN call_records r ON r.started_at::date = days.d
        GROUP BY days.d) s))
) AS o`;

export const ROUTR = `
SELECT json_build_object(
  'agents', (SELECT count(*) FROM agents),
  'numbers', (SELECT count(*) FROM numbers),
  'trunks', (SELECT count(*) FROM trunks),
  'domains', (SELECT count(*) FROM domains),
  'new_7d', json_build_object(
    'agents', (SELECT count(*) FROM agents WHERE created_at > now() - interval '7 days'),
    'numbers', (SELECT count(*) FROM numbers WHERE created_at > now() - interval '7 days'),
    'trunks', (SELECT count(*) FROM trunks WHERE created_at > now() - interval '7 days'))
) AS o`;

/**
 * Converted = an owner's first grant paid through Stripe (source "invoice:<id>").
 * Credits (1 credit = 1000 milli-credits = $0.01), rounded down: purchased = grants paid through
 * Stripe; free = every other grant, minus what a trial carry-over moved to a new grant (its expiry
 * has source "carry:<grant>"), so a carried grant counts once; used = debits, by the kind of grant
 * they took from; overdraft = usage no grant has paid yet; expired = what grants lost at expiry.
 */
export const BILLING = `
WITH firsts AS (
  SELECT account_id, min(created_at) AS at
  FROM public.balance_ledger
  WHERE kind IN ('plan_grant', 'topup_grant') AND source LIKE 'invoice:%'
  GROUP BY account_id),
grants AS (
  SELECT id, (kind IN ('plan_grant', 'topup_grant') AND source LIKE 'invoice:%') AS paid
  FROM public.balance_ledger
  WHERE kind LIKE '%\\_grant'),
credits AS (
  SELECT
    coalesce(sum(l.amount_milli) FILTER (WHERE g.paid AND l.id = g.id), 0) AS purchased,
    coalesce(sum(l.amount_milli) FILTER (WHERE NOT g.paid AND l.id = g.id), 0)
      + coalesce(sum(l.amount_milli) FILTER (WHERE l.kind = 'expiry' AND l.source LIKE 'carry:%'), 0) AS free,
    -coalesce(sum(l.amount_milli) FILTER (WHERE l.kind = 'debit' AND g.paid AND l.grant_id = g.id), 0) AS purchased_used,
    -coalesce(sum(l.amount_milli) FILTER (WHERE l.kind = 'debit' AND NOT g.paid AND l.grant_id = g.id), 0) AS free_used,
    -coalesce(sum(l.amount_milli) FILTER (WHERE l.bucket = 'overdraft'), 0) AS overdraft,
    -coalesce(sum(l.amount_milli) FILTER (WHERE l.kind = 'expiry' AND l.source LIKE 'expiry:%'), 0) AS expired
  FROM public.balance_ledger l
  LEFT JOIN grants g ON g.id = coalesce(l.grant_id, l.id))
SELECT json_build_object(
  'present', 1,
  'accounts', (SELECT count(*) FROM public.billing_accounts),
  'trial', (SELECT count(*) FROM public.billing_accounts WHERE plan = 'trial'),
  'payg', (SELECT count(*) FROM public.billing_accounts WHERE plan = 'payg'),
  'past_due', (SELECT count(*) FROM public.billing_accounts WHERE status = 'past_due'),
  'converted', (SELECT count(*) FROM firsts),
  'converted_24h', (SELECT count(*) FROM firsts WHERE at > now() - interval '24 hours'),
  'converted_7d', (SELECT count(*) FROM firsts WHERE at > now() - interval '7 days'),
  'credits_purchased', (SELECT floor(greatest(purchased, 0) / 1000)::bigint FROM credits),
  'credits_purchased_used', (SELECT floor(greatest(purchased_used, 0) / 1000)::bigint FROM credits),
  'credits_free', (SELECT floor(greatest(free, 0) / 1000)::bigint FROM credits),
  'credits_free_used', (SELECT floor(greatest(free_used, 0) / 1000)::bigint FROM credits),
  'credits_overdraft', (SELECT floor(greatest(overdraft, 0) / 1000)::bigint FROM credits),
  'credits_expired', (SELECT floor(greatest(expired, 0) / 1000)::bigint FROM credits),
  'daily', json_build_object('converted', (SELECT json_agg(c ORDER BY d) FROM (
      SELECT days.d, count(f.account_id) AS c
      FROM (SELECT ((now() AT TIME ZONE 'UTC')::date - 13 + i) AS d FROM generate_series(0, 13) AS i) days
      LEFT JOIN firsts f ON (f.at AT TIME ZONE 'UTC')::date = days.d
      GROUP BY days.d) s))
) AS o`;
