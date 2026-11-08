SET TimeZone = 'UTC';
INSERT INTO billing_accounts (id, owner_ref, plan, status) VALUES
  ('b1', 'u2', 'payg',  'active'),     -- converted today
  ('b2', 'u4', 'payg',  'active'),     -- converted 3 days ago
  ('b3', 'u1', 'payg',  'past_due'),   -- converted 30 days ago
  ('b4', 'u3', 'trial', 'active'),     -- never paid
  ('b5', 'u5', 'trial', 'active'),     -- operator credit only (not a conversion)
  ('b6', 'u6', 'trial', 'active');     -- trial grant only
-- Grants: purchased 2500 + 1000 + 2500 + 2500 = 8500 credits; free 500 + 200 + 500 = 1200 (l8 is
-- the 300 that l7 carried over: it doesn't count twice).
INSERT INTO balance_ledger (id, account_id, kind, bucket, amount_milli, grant_id, source, created_at) VALUES
  ('l1', 'b1', 'trial_grant', 'trial', 500000,  NULL, 'trial:b1',             now() - interval '20 days'),
  ('l2', 'b1', 'plan_grant',  'plan',  2500000, NULL, 'invoice:in_1',         date_trunc('day', now())),
  ('l3', 'b1', 'topup_grant', 'topup', 1000000, NULL, 'invoice:in_2',         date_trunc('day', now()) + interval '1 second'),
  ('l4', 'b2', 'plan_grant',  'plan',  2500000, NULL, 'invoice:in_3',         date_trunc('day', now()) - interval '3 days' + interval '1 hour'),
  ('l5', 'b3', 'plan_grant',  'plan',  2500000, NULL, 'invoice:in_4',         now() - interval '30 days'),
  ('l6', 'b5', 'topup_grant', 'topup', 200000,  NULL, 'operator: gift for testing', now() - interval '2 days'),
  ('l7', 'b6', 'trial_grant', 'trial', 500000,  NULL, 'trial:b6',             now() - interval '5 days'),
  -- b6 used 200 of its Trial, then an operator moved the 300 left to a new grant.
  ('d1', 'b6', 'debit',       'trial', -200000, 'l7', 'usage:1',              now() - interval '4 days'),
  ('x1', 'b6', 'expiry',      'trial', -300000, 'l7', 'carry:l7',             now() - interval '3 days'),
  ('l8', 'b6', 'trial_grant', 'trial', 300000,  NULL, 'trial-days:30:x',      now() - interval '3 days'),
  ('d2', 'b6', 'debit',       'trial', -100000, 'l8', 'usage:2',              now() - interval '1 day'),
  -- b1's Trial expired with 500 left; it then used 1000.5 of its plan.
  ('x2', 'b1', 'expiry',      'trial', -500000, 'l1', 'expiry:l1',            now() - interval '1 day'),
  ('d3', 'b1', 'debit',       'plan',  -1000500, 'l2', 'usage:3',             now()),
  -- b3 owes 50; b2 owed 30 and its plan grant repaid it.
  ('d4', 'b3', 'debit',       'overdraft', -50000, NULL, 'usage:4',           now() - interval '2 days'),
  ('d5', 'b2', 'debit',       'overdraft', -30000, NULL, 'usage:5',           now() - interval '4 days'),
  ('d6', 'b2', 'debit',       'plan',  -30000,  'l4', 'overdraft_repay:l4',   date_trunc('day', now()) - interval '3 days' + interval '1 hour'),
  ('d7', 'b2', 'adjustment',  'overdraft', 30000, NULL, 'overdraft_repay:l4', date_trunc('day', now()) - interval '3 days' + interval '1 hour');
