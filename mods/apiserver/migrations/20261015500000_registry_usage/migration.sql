-- add-provider-registry (LO-B11): sessions that resolved each catalog id, per workspace and day (additive)
CREATE TABLE "registry_usage" (
    "access_key_id" TEXT NOT NULL,
    "catalog_id" VARCHAR(255) NOT NULL,
    "day" DATE NOT NULL,
    "sessions" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "registry_usage_pkey" PRIMARY KEY ("access_key_id","catalog_id","day")
);

CREATE INDEX "registry_usage_catalog_id_day_idx" ON "registry_usage"("catalog_id", "day");
