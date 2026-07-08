-- Migration: add_map_unlock_chain
-- Phase: Fix unlock chain per user feedback — Minimal Pairs should unlock
-- from Vowels (not Consonants), Stress & Linking should unlock from
-- Minimal Pairs (not Consonants).
--
-- Adds self-referential FK on LearningMap so any map can require another map
-- at a configurable completion threshold. UI surfaces "Sương mù đang che phủ"
-- when the prerequisite is not yet met.

-- AlterTable
ALTER TABLE "LearningMap" ADD COLUMN "requiredMapId" TEXT;
ALTER TABLE "LearningMap" ADD COLUMN "unlockThresholdPercent" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "LearningMap_requiredMapId_idx" ON "LearningMap"("requiredMapId");

-- AddForeignKey
ALTER TABLE "LearningMap" ADD CONSTRAINT "LearningMap_requiredMapId_fkey"
  FOREIGN KEY ("requiredMapId") REFERENCES "LearningMap"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
