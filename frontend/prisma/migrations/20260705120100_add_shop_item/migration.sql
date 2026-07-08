-- Migration: add_shop_item
-- Phase B2 of admin limitations fix (PLAN/ADMIN_DASHBOARD_new.md §2)
-- Adds ShopItem table so admin can manage shop catalog with real CRUD.

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'power_up',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopItem_key_key" ON "ShopItem"("key");

-- CreateIndex
CREATE INDEX "ShopItem_category_status_sortOrder_idx" ON "ShopItem"("category", "status", "sortOrder");
