-- Who answered a call, by answering machine detection (#1066): null when AMD didn't run.
ALTER TABLE "call_records" ADD COLUMN "amd_status" TEXT;
