/*
  Warnings:

  - You are about to drop the column `accessKeyId` on the `applications` table. All the data in the column will be lost.
  - You are about to drop the column `accessKeyId` on the `secrets` table. All the data in the column will be lost.
  - Added the required column `access_key_id` to the `applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `access_key_id` to the `secrets` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "applications_accessKeyId_idx";

-- DropIndex
DROP INDEX "secrets_accessKeyId_idx";

-- AlterTable
ALTER TABLE "applications" DROP COLUMN "accessKeyId",
ADD COLUMN     "access_key_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "secrets" DROP COLUMN "accessKeyId",
ADD COLUMN     "access_key_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "applications_access_key_id_idx" ON "applications" USING HASH ("access_key_id");

-- CreateIndex
CREATE INDEX "secrets_access_key_id_idx" ON "secrets" USING HASH ("access_key_id");

-- CreateIndex
CREATE INDEX "secrets_name_idx" ON "secrets" USING HASH ("name");
