-- add-private-regions: regions, enrollment tokens, cell credentials and usage
CREATE TABLE "regions" (
    "ref" VARCHAR(64) NOT NULL,
    "access_key_id" TEXT NOT NULL,
    "state" VARCHAR(16) NOT NULL DEFAULT 'waiting',
    "cell_public_key" TEXT,
    "version" VARCHAR(64),
    "components" JSONB,
    "active_calls" INTEGER NOT NULL DEFAULT 0,
    "secrets_set" TEXT[],
    "reported_config_version" INTEGER NOT NULL DEFAULT 0,
    "config_version" INTEGER NOT NULL DEFAULT 0,
    "last_heartbeat_at" TIMESTAMP(3),
    "enrolled_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "regions_pkey" PRIMARY KEY ("ref")
);
CREATE UNIQUE INDEX "regions_access_key_id_key" ON "regions"("access_key_id");

CREATE TABLE "region_tokens" (
    "jti" VARCHAR(64) NOT NULL,
    "region_ref" VARCHAR(64) NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    CONSTRAINT "region_tokens_pkey" PRIMARY KEY ("jti")
);
CREATE INDEX "region_tokens_region_ref_idx" ON "region_tokens"("region_ref");

CREATE TABLE "region_credentials" (
    "user_public_key" VARCHAR(64) NOT NULL,
    "region_ref" VARCHAR(64) NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    CONSTRAINT "region_credentials_pkey" PRIMARY KEY ("user_public_key")
);
CREATE INDEX "region_credentials_region_ref_idx" ON "region_credentials"("region_ref");

CREATE TABLE "region_usage" (
    "region_ref" VARCHAR(64) NOT NULL,
    "period" VARCHAR(16) NOT NULL,
    "minutes" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "region_usage_pkey" PRIMARY KEY ("region_ref","period")
);
