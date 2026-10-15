-- CreateTable
CREATE TABLE "call_records" (
    "call_ref" TEXT NOT NULL,
    "access_key_id" TEXT,
    "app_ref" TEXT,
    "from_number" TEXT,
    "to_number" TEXT,
    "direction" TEXT,
    "status" TEXT NOT NULL,
    "end_reason" TEXT,
    "failure_reason" TEXT,
    "sip_status" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "region" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "size" BIGINT NOT NULL DEFAULT 0,
    "parts" TEXT[],
    "erased_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_records_pkey" PRIMARY KEY ("call_ref")
);

-- CreateTable
CREATE TABLE "call_record_audits" (
    "ref" TEXT NOT NULL,
    "call_ref" TEXT NOT NULL,
    "access_key_id" TEXT,
    "action" TEXT NOT NULL,
    "part" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_record_audits_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "call_record_retention" (
    "ref" TEXT NOT NULL,
    "access_key_id" TEXT NOT NULL,
    "part" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_record_retention_pkey" PRIMARY KEY ("ref")
);

-- CreateIndex
CREATE INDEX "call_records_access_key_id_started_at_idx" ON "call_records"("access_key_id", "started_at");

-- CreateIndex
CREATE INDEX "call_record_audits_call_ref_idx" ON "call_record_audits"("call_ref");

-- CreateIndex
CREATE INDEX "call_record_audits_access_key_id_at_idx" ON "call_record_audits"("access_key_id", "at");

-- CreateIndex
CREATE UNIQUE INDEX "call_record_retention_access_key_id_part_key" ON "call_record_retention"("access_key_id", "part");

