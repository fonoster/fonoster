SET TimeZone = 'UTC';
INSERT INTO billing_accounts (id, owner_ref, plan, status) VALUES
  ('b1', 'u2', 'payg',  'active'),     -- converted today
  ('b2', 'u4', 'payg',  'active'),     -- converted 3 days ago
  ('b3', 'u1', 'payg',  'past_due'),   -- converted 30 days ago
  ('b4', 'u3', 'trial', 'active'),     -- never paid
  ('b5', 'u5', 'trial', 'active'),     -- operator credit only (not a conversion)
  ('b6', 'u6', 'trial', 'active');     -- trial grant only
INSERT INTO balance_ledger (id, account_id, kind, bucket, amount_milli, source, created_at) VALUES
  ('l1', 'b1', 'trial_grant', 'trial', 1, 'trial:cus_1',          now() - interval '20 days'),
  ('l2', 'b1', 'plan_grant',  'plan',  1, 'invoice:in_1',         date_trunc('day', now())),
  ('l3', 'b1', 'topup_grant', 'topup', 1, 'invoice:in_2',         date_trunc('day', now()) + interval '1 second'),
  ('l4', 'b2', 'plan_grant',  'plan',  1, 'invoice:in_3',         date_trunc('day', now()) - interval '3 days' + interval '1 hour'),
  ('l5', 'b3', 'plan_grant',  'plan',  1, 'invoice:in_4',         now() - interval '30 days'),
  ('l6', 'b5', 'topup_grant', 'topup', 1, 'operator: gift for testing', now() - interval '2 days'),
  ('l7', 'b6', 'trial_grant', 'trial', 1, 'trial:cus_6',          now() - interval '5 days');
