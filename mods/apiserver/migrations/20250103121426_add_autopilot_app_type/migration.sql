/*
  Warnings:

  - The values [ASSISTANT] on the enum `product_types` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `credentials_hash` to the `stt_services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `credentials_hash` to the `tts_services` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "application_types" ADD VALUE 'AUTOPILOT';

-- AlterEnum
BEGIN;
CREATE TYPE "product_types_new" AS ENUM ('TTS', 'STT', 'LLM');
ALTER TABLE "products" ALTER COLUMN "type" TYPE "product_types_new" USING ("type"::text::"product_types_new");
ALTER TYPE "product_types" RENAME TO "product_types_old";
ALTER TYPE "product_types_new" RENAME TO "product_types";
DROP TYPE "product_types_old";
COMMIT;

-- AlterTable
ALTER TABLE "stt_services" ADD COLUMN     "credentials_hash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tts_services" ADD COLUMN     "credentials_hash" TEXT NOT NULL;
