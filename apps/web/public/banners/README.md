# Event Banners

Drop the Sound of Revival event banner images here with these exact filenames:

- `sound-of-revival-uk.jpg`       — UK Apostolic Conference (Liverpool)
- `sound-of-revival-canada.jpg`   — Canada Apostolic Conference (Mississauga)
- `sound-of-revival-usa.jpg`      — USA Apostolic Conference

These are referenced by the seed script (`packages/db/src/seed.ts`) and the dev-data
fallback (`apps/web/lib/dev-data.ts`). Once placed here, Next.js serves them as
static assets at `/banners/<filename>`.

In production, event banners are uploaded through the admin panel and stored in
Cloudflare R2. The `/banners/` directory is for local development only.
