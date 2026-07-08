-- Migration: add_spin_wheel_prize
-- Phase C2 of admin limitations fix (PLAN/ADMIN_DASHBOARD_new.md §3)
-- Adds SpinWheelPrize table so admin can manage wheel config with real CRUD.

-- CreateTable
CREATE TABLE "SpinWheelPrize" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "prize" TEXT NOT NULL,
    "prizeValue" INTEGER NOT NULL DEFAULT 0,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpinWheelPrize_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpinWheelPrize_key_key" ON "SpinWheelPrize"("key");

-- CreateIndex
CREATE INDEX "SpinWheelPrize_status_sortOrder_idx" ON "SpinWheelPrize"("status", "sortOrder");
