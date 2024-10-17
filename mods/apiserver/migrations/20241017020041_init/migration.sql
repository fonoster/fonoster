-- CreateEnum
CREATE TYPE "application_types" AS ENUM ('EXTERNAL');

-- CreateEnum
CREATE TYPE "product_types" AS ENUM ('TTS', 'STT', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "product_vendors" AS ENUM ('GOOGLE', 'MICROSOFT', 'AMAZON', 'DEEPGRAM', 'IBM', 'RASA', 'OPENAI', 'GROQ', 'ELEVEN_LABS', 'GENERIC');

-- CreateTable
CREATE TABLE "applications" (
    "ref" TEXT NOT NULL,
    "access_key_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "application_types" NOT NULL,
    "endpoint" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "tts_services" (
    "ref" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "application_ref" TEXT NOT NULL,
    "product_ref" TEXT NOT NULL,

    CONSTRAINT "tts_services_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "stt_services" (
    "ref" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "application_ref" TEXT NOT NULL,
    "product_ref" TEXT NOT NULL,

    CONSTRAINT "stt_services_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "intelligence_services" (
    "ref" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "credentials_hash" TEXT NOT NULL,
    "application_ref" TEXT NOT NULL,
    "product_ref" TEXT NOT NULL,

    CONSTRAINT "intelligence_services_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "products" (
    "ref" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendor" "product_vendors" NOT NULL,
    "type" "product_types" NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "secrets" (
    "ref" TEXT NOT NULL,
    "access_key_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "secret_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "secrets_pkey" PRIMARY KEY ("ref")
);

-- CreateIndex
CREATE INDEX "applications_access_key_id_idx" ON "applications" USING HASH ("access_key_id");

-- CreateIndex
CREATE UNIQUE INDEX "tts_services_application_ref_key" ON "tts_services"("application_ref");

-- CreateIndex
CREATE INDEX "tts_services_application_ref_idx" ON "tts_services" USING HASH ("application_ref");

-- CreateIndex
CREATE INDEX "tts_services_product_ref_idx" ON "tts_services" USING HASH ("product_ref");

-- CreateIndex
CREATE UNIQUE INDEX "stt_services_application_ref_key" ON "stt_services"("application_ref");

-- CreateIndex
CREATE INDEX "stt_services_application_ref_idx" ON "stt_services" USING HASH ("application_ref");

-- CreateIndex
CREATE INDEX "stt_services_product_ref_idx" ON "stt_services" USING HASH ("product_ref");

-- CreateIndex
CREATE UNIQUE INDEX "intelligence_services_application_ref_key" ON "intelligence_services"("application_ref");

-- CreateIndex
CREATE INDEX "intelligence_services_application_ref_idx" ON "intelligence_services" USING HASH ("application_ref");

-- CreateIndex
CREATE INDEX "intelligence_services_product_ref_idx" ON "intelligence_services" USING HASH ("product_ref");

-- CreateIndex
CREATE INDEX "secrets_access_key_id_idx" ON "secrets" USING HASH ("access_key_id");

-- CreateIndex
CREATE INDEX "secrets_name_idx" ON "secrets" USING HASH ("name");

-- AddForeignKey
ALTER TABLE "tts_services" ADD CONSTRAINT "tts_services_application_ref_fkey" FOREIGN KEY ("application_ref") REFERENCES "applications"("ref") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tts_services" ADD CONSTRAINT "tts_services_product_ref_fkey" FOREIGN KEY ("product_ref") REFERENCES "products"("ref") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stt_services" ADD CONSTRAINT "stt_services_application_ref_fkey" FOREIGN KEY ("application_ref") REFERENCES "applications"("ref") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stt_services" ADD CONSTRAINT "stt_services_product_ref_fkey" FOREIGN KEY ("product_ref") REFERENCES "products"("ref") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intelligence_services" ADD CONSTRAINT "intelligence_services_application_ref_fkey" FOREIGN KEY ("application_ref") REFERENCES "applications"("ref") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intelligence_services" ADD CONSTRAINT "intelligence_services_product_ref_fkey" FOREIGN KEY ("product_ref") REFERENCES "products"("ref") ON DELETE CASCADE ON UPDATE CASCADE;
