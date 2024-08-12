/*
  Warnings:

  - You are about to drop the column `appEndpoint` on the `applications` table. All the data in the column will be lost.
  - Added the required column `endpoint` to the `applications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "applications" DROP COLUMN "appEndpoint",
ADD COLUMN     "endpoint" VARCHAR(255) NOT NULL;
