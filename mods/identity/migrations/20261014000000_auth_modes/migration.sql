-- AlterTable
ALTER TABLE "users" ADD COLUMN     "must_change_password" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "password_digest" VARCHAR(255),
ALTER COLUMN "password_hash" DROP NOT NULL;

-- AlterTable
ALTER TABLE "verification_codes" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "consumed_at" TIMESTAMPTZ(3);

-- CreateIndex
CREATE INDEX "verification_codes_type_value_idx" ON "verification_codes"("type", "value");

