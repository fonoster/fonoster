-- AlterTable
ALTER TABLE "intelligence_services" ALTER COLUMN "credentials_hash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "stt_services" ALTER COLUMN "credentials_hash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tts_services" ALTER COLUMN "credentials_hash" DROP NOT NULL;
