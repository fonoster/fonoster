-- CreateTable
CREATE TABLE "refresh_tokens" (
    "jti" VARCHAR(64) NOT NULL,
    "family_id" VARCHAR(64) NOT NULL,
    "access_key_id" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("jti")
);

-- CreateIndex
CREATE INDEX "refresh_tokens_family_id_idx" ON "refresh_tokens"("family_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_access_key_id_idx" ON "refresh_tokens"("access_key_id");
