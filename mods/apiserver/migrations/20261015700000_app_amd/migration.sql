-- AlterTable
ALTER TABLE "applications" ADD COLUMN     "amd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "amd_window_ms" INTEGER;
