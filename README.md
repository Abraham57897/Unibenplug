# UnibenPlug (v3)

Next.js 14 App Router, Tailwind, Supabase, Leaflet (OpenStreetMap tiles). Launches with UNIBEN only.

## Set up
1. Create a Supabase project. In **Authentication > Providers > Email**, turn OFF "Confirm email".
2. SQL editor: paste and run `supabase/schema.sql` (once).
3. Paystack: create an account at paystack.com and complete business verification. Copy your secret key into `PAYSTACK_SECRET_KEY`. After deploying, add `https://YOUR-SITE/api/boost/webhook` as the Webhook URL (Settings > API Keys & Webhooks). Test with `sk_test_` first.
4. `cp .env.example .env.local` and fill the keys. Get a Sightengine account for the nudity check.
5. `npm install && npm run dev`
6. Sign up in the app, then in the SQL editor: `update profiles set is_admin = true where phone = 'YOUR PHONE';`
7. Database > Extensions: enable `pg_cron`, then uncomment the `cron.schedule` line at the end of the hourly-job block in schema.sql and run it.
8. Deploy: push to GitHub, import in Vercel, add the same env vars.

## Where the rules live
All moderation (banned words, first 2 posts pending, 3 strikes ban, free boost, urgent, 24h/30d expiry) is in the `create_post` SQL function, so it cannot be skipped from the browser. Reports, ratings, views and boost payments also go through SQL functions; direct inserts are blocked by RLS.

## Small additions to your spec (needed to work)
- `profiles.is_admin` so /admin can be locked to admins.
- Login uses phone + password by turning the phone number into a hidden email (`0801...@unibenplug.app`), because Supabase phone login needs a paid SMS provider.
- Views `feed_posts`, `seller_public`, `free_slots` so the public map can show seller name, verified badge and rating without exposing phone numbers.
- NEED categories: I read your list as 8 (Cleaning, Laundry & Errand is one).

## Known limits
- Views only count for logged-in visitors (post_views needs a viewer_id).
- The 24h rating popup uses tap times stored on the buyer's device.
- Nudity check runs only if the Sightengine keys are set. Check the response field names against their docs.
- Boosts are paid through Paystack and start automatically. `apply_paid_boost` checks the paid amount equals the plan price. The webhook is the reliable path; the return-from-Paystack check makes it instant.
- A second boost replaces the first rather than stacking.
- Paystack sends its receipt to the hidden login email, so buyers will not get one by email.
- Not run end to end: I had no network in my workspace, so `npm install` and a Supabase test were not possible. Expect a small fix or two on first run.
