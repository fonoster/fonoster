-- Send and reset limits shared by every Identity replica (ST-4).

-- CreateTable
CREATE TABLE "rate_limit_windows" (
    "key" VARCHAR(255) NOT NULL,
    "started_at" TIMESTAMPTZ(3) NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "rate_limit_windows_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "rate_limit_windows_started_at_idx" ON "rate_limit_windows"("started_at");
