-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "workspace_member_status" AS ENUM ('PENDING', 'ACTIVE');

-- CreateEnum
CREATE TYPE "workspace_member_role" AS ENUM ('OWNER', 'ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "api_key_role" AS ENUM ('WORKSPACE_ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "ref" TEXT NOT NULL,
    "access_key_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "password_hash" TEXT NOT NULL,
    "phone_number" VARCHAR(20),
    "phone_number_verified" BOOLEAN NOT NULL DEFAULT false,
    "avatar" VARCHAR(255),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "ref" TEXT NOT NULL,
    "access_key_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "owner_ref" TEXT NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "ref" TEXT NOT NULL,
    "status" "workspace_member_status" NOT NULL DEFAULT 'PENDING',
    "role" "workspace_member_role" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_ref" TEXT NOT NULL,
    "workspace_ref" TEXT NOT NULL,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "ref" TEXT NOT NULL,
    "access_key_id" VARCHAR(255) NOT NULL,
    "access_key_secret" VARCHAR(255) NOT NULL,
    "role" "api_key_role" NOT NULL DEFAULT 'WORKSPACE_ADMIN',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3),
    "workspace_ref" TEXT NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "verification_codes" (
    "ref" TEXT NOT NULL,
    "type" "VerificationType" NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("ref")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_access_key_id_key" ON "users"("access_key_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users" USING HASH ("email");

-- CreateIndex
CREATE INDEX "users_access_key_id_idx" ON "users" USING HASH ("access_key_id");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_access_key_id_key" ON "workspaces"("access_key_id");

-- CreateIndex
CREATE INDEX "workspaces_access_key_id_idx" ON "workspaces" USING HASH ("access_key_id");

-- CreateIndex
CREATE INDEX "workspaces_owner_ref_idx" ON "workspaces" USING HASH ("owner_ref");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_user_ref_workspace_ref_key" ON "workspace_members"("user_ref", "workspace_ref");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_access_key_id_key" ON "api_keys"("access_key_id");

-- CreateIndex
CREATE INDEX "api_keys_access_key_id_idx" ON "api_keys" USING HASH ("access_key_id");

-- CreateIndex
CREATE INDEX "api_keys_workspace_ref_idx" ON "api_keys" USING HASH ("workspace_ref");

-- CreateIndex
CREATE INDEX "verification_codes_code_idx" ON "verification_codes" USING HASH ("code");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_ref_fkey" FOREIGN KEY ("owner_ref") REFERENCES "users"("ref") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_ref_fkey" FOREIGN KEY ("user_ref") REFERENCES "users"("ref") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_ref_fkey" FOREIGN KEY ("workspace_ref") REFERENCES "workspaces"("ref") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_workspace_ref_fkey" FOREIGN KEY ("workspace_ref") REFERENCES "workspaces"("ref") ON DELETE CASCADE ON UPDATE CASCADE;
