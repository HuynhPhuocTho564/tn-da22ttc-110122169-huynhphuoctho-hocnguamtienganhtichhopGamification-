-- Migration: add_topic_map_id
-- Phase A2 of admin limitations fix (PLAN/ADMIN_DASHBOARD_new.md)
-- Adds optional mapId FK to Topic so each map tab can filter to its own topics.

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN "mapId" TEXT;

-- CreateIndex
CREATE INDEX "Topic_mapId_idx" ON "Topic"("mapId");

-- AddForeignKey
ALTER TABLE "Topic" ADD CONSTRAINT "Topic_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "LearningMap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: derive topic.mapId from the most common exercise.mapId per topic.
-- (Existing topics in DB after seed_lessons.ts have exercises with mapId set.)
UPDATE "Topic" t
SET "mapId" = sub.map_id
FROM (
  SELECT "topicId", MODE() WITHIN GROUP (ORDER BY "mapId") AS map_id
  FROM "Exercise"
  WHERE "mapId" IS NOT NULL
  GROUP BY "topicId"
) AS sub
WHERE t.id = sub."topicId"
  AND t."mapId" IS NULL;
