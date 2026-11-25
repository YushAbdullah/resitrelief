# Resit Relief

A phone-first web app that keeps every receipt, sorts it into Malaysian LHDN personal tax reliefs, and shows how much of each relief limit you have used.

- Snap or upload a receipt. Text is read on the device (Tesseract.js in `vendor/ocr`).
- Paste Shopee, TikTok Shop or bill e-receipts.
- Relief suggestion with confidence. Unsure ones go to "To check".
- Dashboard per YA with limits and sub-limits, proof kept with every receipt, CSV export.

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
| `app.js` | Screens, storage (IndexedDB), add-receipt flow, OCR |
| `engine.js` | Receipt text parser, relief categoriser, cap totals, tax estimate. No DOM, runs in Node too |
| `reliefs.js` | YA 2025 to 2027 relief list, limits, sub-limits, proof hints |
| `adapters/myinvois.js` | LHDN MyInvois e-invoice adapter (server-side) |
| `DESIGN.md` | Design system |
| `PLAN.md` | Automation roadmap and what LHDN does and does not offer |
