-- Usage published for billing (add-billing-service D2): null until the outbox publisher sent it.
ALTER TABLE "usage_events" ADD COLUMN "published_at" TIMESTAMPTZ(3);

CREATE INDEX "usage_events_unpublished_idx" ON "usage_events"("recorded_at") WHERE "published_at" IS NULL;
