# Resit Relief

A phone-first web app that keeps every receipt, sorts it into Malaysian LHDN personal tax reliefs, and shows how much of each relief limit you have used.

- Snap or upload a receipt. Text is read on the device (Tesseract.js in `vendor/ocr`).
- Paste Shopee, TikTok Shop or bill e-receipts.
- Relief suggestion with confidence. Unsure ones go to "To check".
- Dashboard with KPI cards and a highlights carousel, relief limits per YA with sub-limits.
- Receipt history table with filters and bulk ZIP download of proofs, monthly spending table by shop (Shopee, TikTok Shop, Lazada, Shein).
- Accounts and cloud database (Supabase) when configured, otherwise local mode in the browser.
- Email import for marketplace order emails, and versioned relief rules so LHDN policy changes ship without a release.

Going live: see `SETUP.md`.

## Run it

No install needed.

```bash
npm run build      # wraps index.html into dist/ as a full page
npm start          # serves dist/ on http://localhost:8080
npm test           # parser, categoriser and cap tests
```

Open it on your phone on the same Wi-Fi with your computer's IP, or deploy `dist/` to Netlify, Vercel or GitHub Pages. Camera capture needs HTTPS (or localhost).

## Files

| File | What it does |
|---|---|
| `index.html` | Layout and styles (page body, wrapped by the build) |
| `app.js` | Screens, add-receipt flow, OCR, bulk download |
| `store.js` | Storage: Supabase in cloud mode, IndexedDB in local mode |
| `config.js` | Supabase URL and key (empty = local mode) |
| `supabase/schema.sql` | Tables, row-level security, proof storage, relief rules, email addresses |
| `supabase/functions/` | `inbound-email` (forwarded receipts) and `policy-watch` (daily LHDN check) |
| `SETUP.md` | Step-by-step go-live guide |
| `engine.js` | Receipt text parser, relief categoriser, cap totals, tax estimate. No DOM, runs in Node too |
| `reliefs.js` | YA 2025 to 2027 relief list, limits, sub-limits, proof hints |
| `adapters/myinvois.js` | LHDN MyInvois e-invoice adapter (server-side) |
| `DESIGN.md` | Design system |
| `PLAN.md` | Automation roadmap and what LHDN does and does not offer |
