-- add-private-regions PR-12..PR-21: regions belong to a user (private) or the platform (public),
-- have an id, a display name and a SIP domain, and serve several workspaces.
ALTER TABLE "regions" ADD COLUMN "id" VARCHAR(32);
ALTER TABLE "regions" ADD COLUMN "kind" VARCHAR(16) NOT NULL DEFAULT 'private';
ALTER TABLE "regions" ADD COLUMN "owner_ref" VARCHAR(255);
ALTER TABLE "regions" ADD COLUMN "display_name" VARCHAR(120) NOT NULL DEFAULT '';
ALTER TABLE "regions" ADD COLUMN "sip_domain" VARCHAR(253);
ALTER TABLE "regions" ADD COLUMN "published" BOOLEAN NOT NULL DEFAULT false;
DROP INDEX IF EXISTS "regions_access_key_id_key";
ALTER TABLE "regions" ALTER COLUMN "access_key_id" DROP NOT NULL;

-- Old private regions get an id from their ref; their owner (the workspace's owner, in the
-- identity database) is backfilled by the API server at start (RW-B3).
UPDATE "regions" SET "id" = 'private-' || substring("ref" from 4 for 16) WHERE "id" IS NULL;
UPDATE "regions" SET "display_name" = 'Private region' WHERE "display_name" = '';
ALTER TABLE "regions" ALTER COLUMN "id" SET NOT NULL;

CREATE INDEX "regions_owner_ref_idx" ON "regions"("owner_ref");
CREATE UNIQUE INDEX "regions_private_id_key" ON "regions"("owner_ref", "id")
  WHERE "kind" = 'private' AND "deleted_at" IS NULL AND "owner_ref" IS NOT NULL;
CREATE UNIQUE INDEX "regions_public_id_key" ON "regions"("id")
  WHERE "kind" = 'public' AND "deleted_at" IS NULL;

-- Usage per workspace (index/usage name the workspace; PR-14).
ALTER TABLE "region_usage" ADD COLUMN "access_key_id" VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE "region_usage" DROP CONSTRAINT "region_usage_pkey";
ALTER TABLE "region_usage" ADD CONSTRAINT "region_usage_pkey" PRIMARY KEY ("region_ref", "access_key_id", "period");
