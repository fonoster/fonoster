-- The trunk of the workspace's number on a call, by name (#1069): null when unknown.
ALTER TABLE "call_records" ADD COLUMN "trunk_name" TEXT;
