# Palm Beach Living — Phase 1

Local real estate website for **Paul Schafranick**, with a Supabase + Prisma database foundation. No Docker is required. Brokerage is omitted. Later phases are documented in `PLAN.md`; Pax chat, lead capture, Facebook ingestion, CRM, and automated messaging are not implemented yet.

## 1. Run on your Windows laptop

Install **Node.js 24 LTS** from nodejs.org. Extract the project archive or open this repository, then open PowerShell in the folder containing `package.json`:

```powershell
node --version
npm.cmd ci
Copy-Item .env.example .env
npm.cmd run dev
```

Open **http://localhost:3000**. Leave that PowerShell window open while using the site. Press Ctrl+C to stop. `npm.cmd` avoids PowerShell script-execution-policy problems. If `.env` already exists, edit it instead of copying over it.

The default `LISTINGS_SOURCE="sample"` explicitly loads five fictional properties from `src/lib/sample-listings.json`. It does not connect to a database or send messages. This lets you review Phase 1 before setting up Supabase.

## Open the password file easily

Double-click **`Open-env.cmd`** in the extracted project folder. It creates `.env` from the template if needed, then opens it in Windows Notepad. Replace `ENCODED_PASSWORD` in both connection lines with your URL-encoded **database password** and save. Do not paste the password in chat or put it in the public config.

## 2. Connect hosted Supabase Postgres

1. Create or choose a Supabase project. Wait for its database to be ready. Use a dedicated project for this site.
Your supplied project is `ztkihbwbkzaugqymsxpy`, with pooler host `aws-1-ca-central-1.pooler.supabase.com`. These non-secret identifiers are prefilled in `.env.example`. Replace `ENCODED_PASSWORD` with your actual URL-encoded database password in `.env`, not chat.

2. Open the project's **Connect** panel. Copy its **Transaction pooler** connection string (usually port **6543**) into `DATABASE_URL` in `.env`.
3. Copy its **Session pooler** connection string (usually port **5432**) into `DIRECT_URL`. This IPv4-friendly endpoint is used by Prisma migrations. The direct `db.PROJECT.supabase.co:5432` endpoint is also usable on an IPv6-capable connection. Copy the exact host from your dashboard; do not guess its region.
4. Substitute your database password, URL-encoding any special characters. Keep `sslmode=require` in both URLs. Do not use the Supabase project HTTP URL or anon key as a PostgreSQL connection string.
5. Keep `LISTINGS_SOURCE="sample"` until migration and seed succeed. In a second PowerShell window run:

```powershell
npm.cmd run db:validate
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run db:check
```

The check should report `Database connected: 5 listings (5 samples).` Running `db:seed` again should still leave five samples, without duplicate photos. It refuses to overwrite a real listing sharing a sample slug.

6. Change `LISTINGS_SOURCE="database"` in `.env`, stop the dev server, then restart:

```powershell
npm.cmd run dev
```

The same website now reads listings from Supabase through Prisma on the server. `db:migrate` uses the committed migration and does **not** require a shadow database. Use `.env` consistently: Next.js, Prisma CLI, and seed/check scripts all read it. The older Supabase snippet puts URLs in `schema.prisma`; this project uses Prisma 7’s `prisma.config.ts` plus the runtime adapter instead. Do not rerun `prisma init`.

The Prisma 7 PostgreSQL adapter handles application connections; the pool is capped at five connections. No browser-side Supabase SDK or service-role key is needed.

### Database access

The migration enables row-level security and revokes `anon` and `authenticated` access to listing tables. The server uses the privileged database connection. Never expose either database URL in client code or a `NEXT_PUBLIC_` variable. Do not disable SSL verification to fix a connection issue. The initial migration is intended for Supabase, whose `anon` and `authenticated` database roles already exist.

## 3. Edit Paul’s information

Edit `config/agent.json` and restart the server after changes. It is the source of truth for name, contact, license number, office address, logo/headshot paths, social links, communities, statistics, reviews, and Pax’s future personality. There is no brokerage field or visible brokerage branding.

- Put a headshot or logo in `public/images/` and use a path such as `/images/paul.jpg`.
- Add only verified statistics; `null` values show “To be added,” never invented numbers.
- Add approved reviews as `{ "name": "Client name", "quote": "Approved testimonial" }` entries. The carousel appears when entries exist.
- Community content: `src/lib/communities.ts`; blog/guides: `src/lib/articles.ts`.
- In sample mode, edit `src/lib/sample-listings.json`. After edits, rerun the seed to update sample rows in Supabase. The real listings manager arrives in Phase 4.

## 4. What to test

1. Open the homepage. Confirm Paul’s name, phone, and email; no brokerage; three sample sale cards; eight community cards; stats/reviews/headshot clearly pending.
2. Click **Work with Paul**. Check that phone and email links launch the appropriate app.
3. Open **Find a home**. Expect five properties and five map markers. Select **Delray Beach**: expect one card and one marker.
4. Set maximum price to **500000** while Delray Beach is selected: expect an empty state and no markers. Click **Clear filters**: all five return.
5. Select **For lease**: expect one Jupiter property at **$3,400 / month**. Check descending price sort and bedroom filters too.
6. Click a map marker, follow **View property**, and inspect photos, facts, contact links, and the detail map. Sample addresses and images are explicitly labeled.
7. Open each community page; use its property-search link and confirm the correct community filter is selected. Communities without sample inventory show an honest empty state.
8. Check About, Contact, Blog and its article, all three Guides, Privacy, Terms, and MLS Disclosure.
9. On a phone-width screen, use Menu; check no horizontal scrolling, readable cards, and usable map controls.
10. Open `/sitemap.xml` and `/robots.txt`. Check the homepage source for `RealEstateAgent` JSON-LD. Local preview intentionally uses **noindex** and disallows crawling; sample listing URLs are excluded from the sitemap. Publication settings will be changed only in the deployment phase after content review.
11. Open **Ask Pax**: it must say live chat is coming in Phase 2. No simulated AI replies, signup walls, visitor tracking, or outbound marketing messages run in Phase 1.
12. After connecting Supabase, repeat the listing checks in database mode. Change one sample price in Supabase Table Editor and reload; verify it appears. Restore it by running the sample seed. If database access fails, the app shows a retryable error, not silent sample fallback.

## 5. Automated checks and production build

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd exec playwright install chromium
npm.cmd run test:e2e
```

Browser tests use sample mode. Stop another running server first if it is using database mode; the test runner can launch its own dev server. Browser screenshots/reports go to ignored test directories.

To test the production server, stop the dev server first, then:

```powershell
npm.cmd run build
npm.cmd start
```

## Environment entries in this phase

| Variable | Purpose | Browser exposure |
| --- | --- | --- |
| `LISTINGS_SOURCE` | `sample` or `database`; explicit source selection | Mode is reflected by displayed data |
| `DATABASE_URL` | Supabase transaction pooler; Prisma runtime | Never |
| `DIRECT_URL` | Supabase session/direct connection; migrations | Never |
| `SITE_URL` | Canonical local URL; later public URL | Public metadata |

Future OpenAI, Twilio, Resend, Meta, and auth secrets are intentionally not requested yet. `.env` files are ignored by Git and excluded from delivery archives.

## Structure

- `config/agent.json`: editable agent settings.
- `src/app/`: server-rendered public routes and metadata.
- `src/components/`: reusable layout, cards, filters, maps, review carousel.
- `src/server/listings/`: `ListingsProvider` contract plus sample and Prisma implementations; future IDX adapter plugs in here.
- `src/server/`: server-only database access and Prisma factory used by CLI scripts.
- `src/lib/`: shared types, filtering, sample data, editorial content.
- `prisma/`: schema, migration, seed; `prisma.config.ts`: CLI connection configuration.
- `tests/`: filtering tests and browser flow tests.
- `PLAN.md`: phase plan including Facebook Instant Forms.
- `VERIFICATION.md`: checks actually run and remaining setup limits.

## Images, maps, and launch readiness

The hero uses a locally stored AI-generated coastal home illustration (`public/images/coastal-home.png`). Listing and community stock photos load from `images.unsplash.com`, with the local illustration as a fallback; none depicts real inventory or specific communities. Map tiles load from OpenStreetMap with attribution. Both need an internet connection and send ordinary web requests to those providers. If map tiles fail, a message appears and listing cards still work. Select a production tile provider appropriate to expected traffic before launch.

This is a **Phase 1 local deliverable**, not a production launch approval. Legal pages are clearly labeled drafts; biography, headshot, verified stats/reviews, current license and any legally required brokerage disclosures need completion/review before public launch. No deployment has been performed.
