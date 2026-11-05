CREATE TABLE "ListingSnapshot" (
  "id" INTEGER PRIMARY KEY CHECK ("id" = 1),
  "listings" JSONB NOT NULL,
  "checkedAt" TIMESTAMPTZ NOT NULL
);
