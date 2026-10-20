-- Usage metering (add-usage-metering): usage lines as facts, and daily totals derived from them.
CREATE TABLE "usage_events" (
    "id" VARCHAR(40) NOT NULL,
    "owner_ref" VARCHAR(255) NOT NULL,
    "workspace_ref" VARCHAR(255) NOT NULL,
    "app_ref" VARCHAR(255),
    "call_ref" VARCHAR(255),
    "region" VARCHAR(64) NOT NULL,
    "region_kind" VARCHAR(16) NOT NULL,
    "origin" VARCHAR(16) NOT NULL,
    "meter" VARCHAR(64) NOT NULL,
    "unit" VARCHAR(16) NOT NULL,
    "quantity" BIGINT NOT NULL,
    "provider" VARCHAR(64),
    "model" VARCHAR(255),
    "key_source" VARCHAR(16),
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "recorded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "usage_events_workspace_ref_occurred_at_idx" ON "usage_events"("workspace_ref", "occurred_at");
CREATE INDEX "usage_events_call_ref_idx" ON "usage_events"("call_ref");

CREATE TABLE "usage_daily" (
    "owner_ref" VARCHAR(255) NOT NULL,
    "workspace_ref" VARCHAR(255) NOT NULL,
    "day" DATE NOT NULL,
    "meter" VARCHAR(64) NOT NULL,
    "provider" VARCHAR(64) NOT NULL DEFAULT '',
    "model" VARCHAR(255) NOT NULL DEFAULT '',
    "key_source" VARCHAR(16) NOT NULL DEFAULT '',
    "origin" VARCHAR(16) NOT NULL,
    "region_kind" VARCHAR(16) NOT NULL,
    "quantity" BIGINT NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_daily_pkey" PRIMARY KEY ("owner_ref","workspace_ref","day","meter","provider","model","key_source","origin","region_kind")
);

CREATE INDEX "usage_daily_workspace_ref_day_idx" ON "usage_daily"("workspace_ref", "day");
