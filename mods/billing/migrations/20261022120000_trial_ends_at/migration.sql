-- Each account's Trial ends at its own time: the configured default when it starts, or what an
-- operator set (billing "The Trial ends"). Existing Trials end when their credits expire.
ALTER TABLE "billing_accounts" ADD COLUMN "trial_ends_at" TIMESTAMPTZ(3);

UPDATE "billing_accounts" a
   SET "trial_ends_at" = (SELECT MAX(g."expires_at") FROM "balance_ledger" g
                           WHERE g."account_id" = a."id" AND g."kind" = 'trial_grant');
