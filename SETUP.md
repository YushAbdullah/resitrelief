# Going live

The app runs in two modes:

- **Local mode** (what the preview shows): no accounts, receipts saved in the browser. Good for demos.
- **Cloud mode**: public sign-up, every receipt and its proof stored in a database, email import, rule updates. It switches on as soon as `config.js` has a Supabase URL and key.

## What you need (all have free tiers to start)

| Service | Why | Cost to start |
|---|---|---|
| GitHub repo | Holds the code, deploys on every push | Free |
| [Supabase](https://supabase.com) project, region Singapore | Database, sign-in, private proof file storage, server functions | Free tier, then about USD 25/month (Pro) once you have real users |
| [Vercel](https://vercel.com) or Netlify | Hosts the web app with HTTPS (needed for the phone camera) | Free |
| A domain, e.g. `resitrelief.my` | Public address, and the receipts email domain | About RM50 to RM150/year for .my |
| [Postmark](https://postmarkapp.com) inbound, or Cloudflare Email Routing | Receives forwarded order emails | Postmark from USD 15/month; Cloudflare free |
| Resend (optional) | Emails you when LHDN's relief pages change | Free tier |

## Steps

1. **Supabase**
   - Create a project (region: Southeast Asia, Singapore).
   - SQL editor: run `supabase/schema.sql`, then `supabase/seed.sql` (`npm run build` regenerates the seed from `reliefs.js`).
   - Authentication → URL configuration: set the Site URL to your domain. Enable Email (magic link) and, if wanted, Google.
   - Project settings → API: copy the Project URL and the `anon` public key into `config.js`.
   - Make yourself an admin: `update profiles set is_admin = true where id = '<your user id>';`

2. **Server functions** (Supabase CLI)
   ```bash
   npm run build                      # refreshes supabase/functions/_shared/engine.js
   supabase functions deploy inbound-email --no-verify-jwt
   supabase functions deploy policy-watch --no-verify-jwt
   supabase secrets set INBOUND_SECRET=<random> WATCH_SECRET=<random> ADMIN_EMAIL=<you> RESEND_API_KEY=<optional>
   ```
   Schedule the policy watch daily (SQL editor, needs the `pg_cron` and `pg_net` extensions):
   ```sql
   select cron.schedule('policy-watch', '0 1 * * *',
     $$ select net.http_post(url := 'https://<project>.supabase.co/functions/v1/policy-watch?key=<WATCH_SECRET>') $$);
   ```

3. **Receipts email**
   - Postmark: create an inbound stream, set your domain's MX for `in.yourdomain` to Postmark, and set the webhook to
     `https://<project>.supabase.co/functions/v1/inbound-email?key=<INBOUND_SECRET>`.
   - Put the same domain in `config.js` as `inboundDomain`.

4. **Hosting**: import the GitHub repo in Vercel. `vercel.json` already sets the build (`npm run build`) and output (`dist`). Add your domain.

5. **Before inviting the public**
   - Write a privacy notice (Malaysia's PDPA applies: you hold people's receipts and spending). Say what you store, why, where (Supabase Singapore), how long, and how to delete. The app already lets people delete everything.
   - Terms of use stating the app is a record-keeping aid and not tax advice.
   - Check the LHDN URLs in the `policy_watch` table still point at the current relief pages.

## Updating relief rules when LHDN changes policy

1. The daily watch flags a changed LHDN page (and emails you if Resend is set).
2. Read the change (Budget speech, Finance Act, LHDN public ruling).
3. Edit `reliefs.js` for that YA, run `npm run build`, and insert the new version:
   ```sql
   update relief_rules set is_active = false where ya = 2027;
   insert into relief_rules (ya, version, rules, note, source_url, is_active)
   values (2027, 2, '<JSON for that YA from seed.sql>', 'Budget 2027 changes now law: sports shoes up to RM300 added', '<gazette link>', true);
   ```
4. Every user sees the new limits and the "What changed" note next time they open the app. No new release needed.

Rules are never changed automatically: a wrong limit would mislead every user, so a person approves each change.
