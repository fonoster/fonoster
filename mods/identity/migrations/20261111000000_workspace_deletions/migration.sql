-- A permanent record of every deleted workspace, written by the database itself so a cascade from
-- a deleted user counts too (#1318). Calls to a deleted workspace are refused, and its call
-- records are erased 30 days later; an operator restores within that window by recreating the
-- workspace row and deleting its deletion record.

-- CreateTable
CREATE TABLE "workspace_deletions" (
  "access_key_id" VARCHAR(255) PRIMARY KEY,
  "deleted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);

-- CreateFunction
CREATE FUNCTION record_workspace_deletion() RETURNS trigger AS $$
BEGIN
  INSERT INTO "workspace_deletions" ("access_key_id") VALUES (OLD."access_key_id")
  ON CONFLICT DO NOTHING;
  RETURN OLD;
END $$ LANGUAGE plpgsql SET search_path FROM CURRENT;

-- CreateTrigger
CREATE TRIGGER workspace_deleted AFTER DELETE ON "workspaces"
  FOR EACH ROW EXECUTE FUNCTION record_workspace_deletion();
