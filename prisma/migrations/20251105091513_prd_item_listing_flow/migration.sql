-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN "orderId" TEXT;

-- CreateTable
CREATE TABLE "TradeHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'RESERVED',
    "proofImages" TEXT NOT NULL,
    "disputeReason" TEXT,
    "adminNotes" TEXT,
    "expiresAt" DATETIME,
    "lastReminderAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Order" ("adminNotes", "buyerId", "createdAt", "disputeReason", "expiresAt", "id", "itemId", "lastReminderAt", "listingId", "price", "proofImages", "sellerId", "status", "updatedAt") SELECT "adminNotes", "buyerId", "createdAt", "disputeReason", "expiresAt", "id", "itemId", "lastReminderAt", "listingId", "price", "proofImages", "sellerId", "status", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE TABLE "new_SaleListing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "image" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SaleListing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SaleListing_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SaleListing" ("createdAt", "description", "id", "image", "itemId", "price", "updatedAt", "userId") SELECT "createdAt", "description", "id", "image", "itemId", "price", "updatedAt", "userId" FROM "SaleListing";
DROP TABLE "SaleListing";
ALTER TABLE "new_SaleListing" RENAME TO "SaleListing";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
