-- Shared state across apiserver replicas (ST-3, ST-4).

-- AlterTable: a config change no snapshot carries yet
ALTER TABLE "regions" ADD COLUMN "config_changed_at" TIMESTAMP(3);

-- CreateTable: relay slots per private region, leased by the replica relaying the download
CREATE TABLE "region_relay_slots" (
    "region_ref" VARCHAR(64) NOT NULL,
    "slot" INTEGER NOT NULL,
    "holder" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "region_relay_slots_pkey" PRIMARY KEY ("region_ref","slot")
);
