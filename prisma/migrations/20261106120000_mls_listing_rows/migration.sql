-- Additive only: new per-listing table and sync-status row. Legacy "ListingSnapshot" is kept for rollback.
CREATE TABLE IF NOT EXISTS "MlsListing" (
  "listingKey" TEXT NOT NULL,
  "mlsNumber" TEXT NOT NULL,
  "mlsKey" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "type" TEXT NOT NULL,
  "propertyType" TEXT,
  "price" DOUBLE PRECISION NOT NULL,
  "beds" INTEGER,
  "baths" DOUBLE PRECISION,
  "sqft" INTEGER,
  "address" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "postalCode" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "pool" BOOLEAN NOT NULL DEFAULT false,
  "waterfront" BOOLEAN NOT NULL DEFAULT false,
  "garage" BOOLEAN NOT NULL DEFAULT false,
  "amenities" JSONB NOT NULL,
  "searchText" TEXT NOT NULL,
  "listedAt" TIMESTAMPTZ(6),
  "sourceUpdatedAt" TIMESTAMPTZ(6) NOT NULL,
  "lastSeenAt" TIMESTAMPTZ(6) NOT NULL,
  "summary" JSONB NOT NULL,
  "detail" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MlsListing_pkey" PRIMARY KEY ("listingKey")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MlsListing_mlsKey_key" ON "MlsListing"("mlsKey");
CREATE INDEX IF NOT EXISTS "MlsListing_active_type_price_idx" ON "MlsListing"("active", "type", "price");
CREATE INDEX IF NOT EXISTS "MlsListing_active_city_price_idx" ON "MlsListing"("active", "city", "price");
CREATE INDEX IF NOT EXISTS "MlsListing_active_postalCode_idx" ON "MlsListing"("active", "postalCode");
CREATE INDEX IF NOT EXISTS "MlsListing_active_sourceUpdatedAt_idx" ON "MlsListing"("active", "sourceUpdatedAt");
CREATE INDEX IF NOT EXISTS "MlsListing_active_latitude_longitude_idx" ON "MlsListing"("active", "latitude", "longitude");
CREATE INDEX IF NOT EXISTS "MlsListing_slug_idx" ON "MlsListing"("slug");

CREATE TABLE IF NOT EXISTS "MlsSyncStatus" (
  "id" INTEGER NOT NULL,
  "lastRunAt" TIMESTAMPTZ(6),
  "lastSuccessAt" TIMESTAMPTZ(6),
  "lastCompleteAt" TIMESTAMPTZ(6),
  "activeCount" INTEGER NOT NULL DEFAULT 0,
  "sourceCount" INTEGER NOT NULL DEFAULT 0,
  "written" INTEGER NOT NULL DEFAULT 0,
  "deactivated" INTEGER NOT NULL DEFAULT 0,
  "complete" BOOLEAN NOT NULL DEFAULT false,
  "durationMs" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "trigger" TEXT,
  CONSTRAINT "MlsSyncStatus_pkey" PRIMARY KEY ("id")
);

-- Match the other tables: only the server database connection may read/write (Supabase Data API blocked).
ALTER TABLE "MlsListing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MlsSyncStatus" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "MlsListing", "MlsSyncStatus" FROM anon, authenticated;
