-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "averagePrice" INTEGER NOT NULL,
    "npcBuyPrice" INTEGER,
    "npcSellPrice" INTEGER,
    "availability" TEXT NOT NULL DEFAULT 'NOT_AVAILABLE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Item" ("availability", "averagePrice", "createdAt", "description", "id", "image", "name", "npcBuyPrice", "npcSellPrice", "rarity", "updatedAt") SELECT "availability", "averagePrice", "createdAt", "description", "id", "image", "name", "npcBuyPrice", "npcSellPrice", "rarity", "updatedAt" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE UNIQUE INDEX "Item_name_key" ON "Item"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
