-- add-private-regions (PR-1, PR-8): every workspace lives in one region; existing ones are pinned
-- to the default public region.
ALTER TABLE "workspaces" ADD COLUMN "region" VARCHAR(64) NOT NULL DEFAULT 'us-east-1';
