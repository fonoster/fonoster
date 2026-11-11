-- A permanent record of every deleted workspace, written by the database itself so a cascade from
-- a deleted user counts too (#1318). Calls to a deleted workspace are refused, and its call
-- records are erased 30 days later, unless a workspace with the same access key exists again (an
-- operator restore within that window). Deleting such a workspace again restarts the 30 days.

-- CreateTable
CREATE TABLE "workspace_deletions" (
  "access_key_id" VARCHAR(255) PRIMARY KEY,
  "deleted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);

-- CreateFunction
CREATE FUNCTION record_workspace_deletion() RETURNS trigger AS $$
BEGIN
  INSERT INTO "workspace_deletions" ("access_key_id") VALUES (OLD."access_key_id")
  ON CONFLICT ("access_key_id") DO UPDATE SET "deleted_at" = now();
  RETURN OLD;
END $$ LANGUAGE plpgsql SET search_path FROM CURRENT;

-- CreateTrigger
CREATE TRIGGER workspace_deleted AFTER DELETE ON "workspaces"
  FOR EACH ROW EXECUTE FUNCTION record_workspace_deletion();
