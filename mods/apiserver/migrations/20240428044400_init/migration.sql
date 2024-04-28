/*
  Warnings:

  - A unique constraint covering the columns `[accessKeyId]` on the table `groups` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[accessKeyId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accessKeyId` to the `groups` table without a default value. This is not possible if the table is not empty.
  - Added the required column `accessKeyId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "accessKeyId" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accessKeyId" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "groups_accessKeyId_key" ON "groups"("accessKeyId");

-- CreateIndex
CREATE UNIQUE INDEX "users_accessKeyId_key" ON "users"("accessKeyId");
