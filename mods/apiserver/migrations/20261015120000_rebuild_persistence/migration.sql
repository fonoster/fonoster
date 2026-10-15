-- CreateEnum
CREATE TYPE "registry_states" AS ENUM ('ACTIVE', 'DEPRECATED', 'RETIRED');

-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "audio" JSONB,
ADD COLUMN     "fallback_app_ref" TEXT,
ADD COLUMN     "fallback_message" TEXT,
ADD COLUMN     "filters" JSONB,
ADD COLUMN     "flavor" VARCHAR(16),
ADD COLUMN     "listeners" JSONB,
ADD COLUMN     "signing_secret_hash" TEXT,
ADD COLUMN     "silence_timeout_ms" INTEGER,
ADD COLUMN     "speech_language" VARCHAR(64),
ADD COLUMN     "speech_settings" JSONB,
ADD COLUMN     "speech_stt_model" VARCHAR(255),
ADD COLUMN     "speech_tts_model" VARCHAR(255),
ADD COLUMN     "speech_voice" VARCHAR(255),
ADD COLUMN     "url" VARCHAR(1024);

-- CreateTable
CREATE TABLE "registry_providers" (
    "id" VARCHAR(64) NOT NULL,
    "adapter" VARCHAR(64) NOT NULL,
    "capabilities" TEXT[],
    "credential_ref" VARCHAR(128) NOT NULL,
    "state" "registry_states" NOT NULL DEFAULT 'ACTIVE',
    "replacement" VARCHAR(255),
    "retire_on" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registry_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry_models" (
    "id" VARCHAR(255) NOT NULL,
    "provider_id" VARCHAR(64) NOT NULL,
    "type" VARCHAR(8) NOT NULL,
    "features" TEXT[],
    "languages" TEXT[],
    "settings" TEXT[],
    "state" "registry_states" NOT NULL DEFAULT 'ACTIVE',
    "replacement" VARCHAR(255),
    "retire_on" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registry_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry_voices" (
    "id" VARCHAR(255) NOT NULL,
    "provider_id" VARCHAR(64) NOT NULL,
    "language" VARCHAR(64),
    "gender" VARCHAR(32),
    "owner_workspace" TEXT,
    "state" "registry_states" NOT NULL DEFAULT 'ACTIVE',
    "replacement" VARCHAR(255),
    "retire_on" VARCHAR(10),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registry_voices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry_voice_models" (
    "voice_id" VARCHAR(255) NOT NULL,
    "model_id" VARCHAR(255) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "registry_voice_models_pkey" PRIMARY KEY ("voice_id","model_id")
);

-- CreateTable
CREATE TABLE "registry_audit" (
    "seq" BIGSERIAL NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "actor" VARCHAR(255) NOT NULL,
    "action" VARCHAR(64) NOT NULL,
    "target" VARCHAR(255) NOT NULL,
    "details" JSONB,

    CONSTRAINT "registry_audit_pkey" PRIMARY KEY ("seq")
);

-- CreateTable
CREATE TABLE "registry_notices" (
    "ref" TEXT NOT NULL,
    "access_key_id" TEXT NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registry_notices_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "workspace_provider_keys" (
    "ref" TEXT NOT NULL,
    "access_key_id" TEXT NOT NULL,
    "provider_id" VARCHAR(64) NOT NULL,
    "secret_ref" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_provider_keys_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "ref" VARCHAR(64) NOT NULL,
    "access_key_id" TEXT NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "events" TEXT[],
    "secret_hash" TEXT NOT NULL,
    "previous_secret_hash" TEXT,
    "previous_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "ref" VARCHAR(64) NOT NULL,
    "endpoint_ref" VARCHAR(64) NOT NULL,
    "access_key_id" TEXT NOT NULL,
    "event_id" VARCHAR(64) NOT NULL,
    "event_type" VARCHAR(64) NOT NULL,
    "event" JSONB NOT NULL,
    "status" VARCHAR(16) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "first_attempt_at" TIMESTAMP(3),
    "last_attempt_at" TIMESTAMP(3),
    "last_status" INTEGER,
    "next_attempt_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("ref")
);

-- CreateIndex
CREATE INDEX "registry_models_provider_id_idx" ON "registry_models"("provider_id");

-- CreateIndex
CREATE INDEX "registry_voices_provider_id_idx" ON "registry_voices"("provider_id");

-- CreateIndex
CREATE INDEX "registry_audit_target_idx" ON "registry_audit"("target");

-- CreateIndex
CREATE INDEX "registry_notices_access_key_id_idx" ON "registry_notices"("access_key_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_provider_keys_access_key_id_provider_id_key" ON "workspace_provider_keys"("access_key_id", "provider_id");

-- CreateIndex
CREATE INDEX "webhook_endpoints_access_key_id_idx" ON "webhook_endpoints"("access_key_id");

-- CreateIndex
CREATE INDEX "webhook_deliveries_endpoint_ref_created_at_idx" ON "webhook_deliveries"("endpoint_ref", "created_at");

-- CreateIndex
CREATE INDEX "webhook_deliveries_status_next_attempt_at_idx" ON "webhook_deliveries"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "applications_speech_voice_idx" ON "applications"("speech_voice");

-- CreateIndex
CREATE INDEX "applications_speech_stt_model_idx" ON "applications"("speech_stt_model");

-- CreateIndex
CREATE INDEX "applications_speech_tts_model_idx" ON "applications"("speech_tts_model");

-- AddForeignKey
ALTER TABLE "registry_voice_models" ADD CONSTRAINT "registry_voice_models_voice_id_fkey" FOREIGN KEY ("voice_id") REFERENCES "registry_voices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_provider_keys" ADD CONSTRAINT "workspace_provider_keys_secret_ref_fkey" FOREIGN KEY ("secret_ref") REFERENCES "secrets"("ref") ON DELETE CASCADE ON UPDATE CASCADE;

