-- Match the existing listing tables: only the server database connection may read/write the replica.
ALTER TABLE "ListingSnapshot" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "ListingSnapshot" FROM anon, authenticated;
