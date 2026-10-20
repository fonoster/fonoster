-- The billing service's database (add-billing-service D1).
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "billing_accounts" (
    "id" TEXT NOT NULL,
    "owner_ref" VARCHAR(255) NOT NULL,
    "plan" VARCHAR(16) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "billing_started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripe_customer_id" VARCHAR(64),
    "stripe_subscription_id" VARCHAR(64),
    "period_start" TIMESTAMPTZ(3),
    "period_end" TIMESTAMPTZ(3),
    "auto_recharge" BOOLEAN NOT NULL DEFAULT false,
    "recharge_threshold_milli" BIGINT,
    "recharge_amount_milli" BIGINT,
    "recharge_failures" INTEGER NOT NULL DEFAULT 0,
    "recharge_pending_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_cards" (
    "version" INTEGER NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "body" JSONB NOT NULL,
    "source" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_cards_pkey" PRIMARY KEY ("version")
);

-- CreateTable
CREATE TABLE "rated_lines" (
    "usage_id" VARCHAR(40) NOT NULL,
    "account_id" TEXT NOT NULL,
    "workspace_ref" VARCHAR(255) NOT NULL,
    "call_ref" VARCHAR(255),
    "meter" VARCHAR(64) NOT NULL,
    "quantity" BIGINT NOT NULL,
    "provider" VARCHAR(64),
    "model" VARCHAR(255),
    "key_source" VARCHAR(16),
    "origin" VARCHAR(16) NOT NULL,
    "billable" BOOLEAN NOT NULL,
    "reason" VARCHAR(32) NOT NULL,
    "amount_milli" BIGINT NOT NULL,
    "rate_card_version" INTEGER,
    "category" VARCHAR(32),
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "rated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rated_lines_pkey" PRIMARY KEY ("usage_id")
);

-- CreateTable
CREATE TABLE "balance_ledger" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "kind" VARCHAR(16) NOT NULL,
    "bucket" VARCHAR(16) NOT NULL,
    "amount_milli" BIGINT NOT NULL,
    "grant_id" TEXT,
    "expires_at" TIMESTAMPTZ(3),
    "effective_at" TIMESTAMPTZ(3),
    "covers_until" TIMESTAMPTZ(3),
    "source" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balance_snapshot" (
    "account_id" TEXT NOT NULL,
    "balance_milli" BIGINT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_snapshot_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "stripe_outbox" (
    "id" TEXT NOT NULL,
    "account_id" TEXT,
    "kind" VARCHAR(32) NOT NULL,
    "payload" JSONB NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "next_attempt_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ(3),
    "result" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stripe_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_events" (
    "id" VARCHAR(64) NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "payload" JSONB NOT NULL,
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applied_at" TIMESTAMPTZ(3),

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_accounts_owner_ref_key" ON "billing_accounts"("owner_ref");

-- CreateIndex
CREATE UNIQUE INDEX "billing_accounts_stripe_customer_id_key" ON "billing_accounts"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "billing_accounts_stripe_subscription_id_key" ON "billing_accounts"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "rated_lines_account_id_occurred_at_idx" ON "rated_lines"("account_id", "occurred_at");

-- CreateIndex
CREATE INDEX "balance_ledger_account_id_created_at_idx" ON "balance_ledger"("account_id", "created_at");

-- CreateIndex
CREATE INDEX "balance_ledger_grant_id_idx" ON "balance_ledger"("grant_id");

-- CreateIndex
CREATE INDEX "stripe_outbox_sent_at_next_attempt_at_idx" ON "stripe_outbox"("sent_at", "next_attempt_at");

-- CreateIndex
CREATE INDEX "stripe_events_applied_at_idx" ON "stripe_events"("applied_at");

-- AddForeignKey
ALTER TABLE "rated_lines" ADD CONSTRAINT "rated_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_ledger" ADD CONSTRAINT "balance_ledger_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "billing_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

