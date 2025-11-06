-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SaleListingTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listingId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SaleListingTag_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "SaleListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SaleListingTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SaleListingTag_listingId_tagId_key" ON "SaleListingTag"("listingId", "tagId");
