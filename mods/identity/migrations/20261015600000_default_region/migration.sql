-- add-private-regions PR-17: the default public region's id is always `default`.
ALTER TABLE "workspaces" ALTER COLUMN "region" SET DEFAULT 'default';
UPDATE "workspaces" SET "region" = 'default' WHERE "region" = 'us-east-1';
