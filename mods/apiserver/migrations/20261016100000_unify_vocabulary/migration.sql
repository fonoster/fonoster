-- unify-vocabulary: a stream (your own WebSocket server) is type STREAM, and its wire protocol is
-- `protocol` (fonoster | twilio), formerly `flavor` (native | twilio).

-- AlterEnum
ALTER TYPE "application_types" RENAME VALUE 'EXTERNAL' TO 'STREAM';

-- AlterTable
ALTER TABLE "applications" RENAME COLUMN "flavor" TO "protocol";
UPDATE "applications" SET "protocol" = 'fonoster' WHERE "protocol" = 'native';
