-- add-private-regions 2.7: connection details reported by a region's cell (additive)
ALTER TABLE "regions" ADD COLUMN "endpoints" JSONB;
ALTER TABLE "regions" ADD COLUMN "endpoints_hash" VARCHAR(64);
ALTER TABLE "regions" ADD COLUMN "endpoints_at" TIMESTAMP(3);
