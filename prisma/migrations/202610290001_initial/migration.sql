CREATE TYPE "ListingType" AS ENUM ('SALE', 'RENT', 'COMMERCIAL');
CREATE TABLE "Listing" (
 "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "title" TEXT NOT NULL, "address" TEXT NOT NULL,
 "city" TEXT NOT NULL, "postalCode" TEXT NOT NULL, "price" INTEGER NOT NULL, "beds" INTEGER NOT NULL,
 "baths" DOUBLE PRECISION NOT NULL, "sqft" INTEGER NOT NULL, "latitude" DOUBLE PRECISION NOT NULL,
 "longitude" DOUBLE PRECISION NOT NULL, "type" "ListingType" NOT NULL DEFAULT 'SALE',
 "status" TEXT NOT NULL DEFAULT 'ACTIVE', "description" TEXT NOT NULL, "features" TEXT[],
 "source" TEXT NOT NULL DEFAULT 'AGENT', "attribution" TEXT, "isSample" BOOLEAN NOT NULL DEFAULT false,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "Listing_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "Listing_price_nonnegative" CHECK ("price" >= 0),
 CONSTRAINT "Listing_dimensions_nonnegative" CHECK ("beds" >= 0 AND "baths" >= 0 AND "sqft" > 0),
 CONSTRAINT "Listing_coordinates_valid" CHECK ("latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)
);
CREATE TABLE "ListingPhoto" (
 "id" TEXT NOT NULL, "listingId" TEXT NOT NULL, "url" TEXT NOT NULL, "alt" TEXT NOT NULL,
 "position" INTEGER NOT NULL DEFAULT 0, CONSTRAINT "ListingPhoto_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");
CREATE INDEX "Listing_status_type_city_price_idx" ON "Listing"("status", "type", "city", "price");
CREATE UNIQUE INDEX "ListingPhoto_listingId_position_key" ON "ListingPhoto"("listingId", "position");
ALTER TABLE "ListingPhoto" ADD CONSTRAINT "ListingPhoto_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Access goes through Prisma on the server, not the Supabase browser Data API.
ALTER TABLE "Listing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ListingPhoto" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "Listing", "ListingPhoto" FROM anon, authenticated;
