/*
  Warnings:

  - The `role` column on the `api_keys` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `workspace_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "role" AS ENUM ('USER', 'WORKSPACE_ADMIN', 'WORKSPACE_OWNER', 'WORKSPACE_MEMBER');

-- AlterTable
ALTER TABLE "api_keys" DROP COLUMN "role",
ADD COLUMN     "role" "role" NOT NULL DEFAULT 'WORKSPACE_MEMBER';

-- AlterTable
ALTER TABLE "workspace_members" DROP COLUMN "role",
ADD COLUMN     "role" "role" NOT NULL DEFAULT 'WORKSPACE_MEMBER';

-- DropEnum
DROP TYPE "api_key_role";

-- DropEnum
DROP TYPE "workspace_member_role";
