# Automation and LHDN plan

The main problem: receipts get thrown away (paper) or buried (Shopee, TikTok Shop, bills). The goal is that most receipts arrive without you doing anything, and the rest take one photo.

## What the prototype does today

- Photo or upload of a receipt, read on the phone with Tesseract OCR (no image leaves the device).
- Paste an e-receipt (Shopee or TikTok order details, a bill email) and it is read the same way.
- Merchant, date and total are pulled out, and a relief category is suggested with a confidence score. Low-confidence guesses go to "To check".
- Dashboard of used vs limit per relief for YA 2025, 2026 and 2027, with sub-limits (dental, vaccination, check-ups, upskilling).
- Receipt photo or text kept as proof, CSV export for e-Filing or a tax agent.
- Storage is IndexedDB on the device.

## What LHDN actually offers

| Need | Public API? | Notes |
|---|---|---|
| Read my relief claims, file Form BE, check "is this claimable" | **No** | MyTax and e-Filing have no public API for individuals. Filing stays manual. The app gives you totals per relief to type in. |
| Receive e-invoices issued to me | **Yes, with limits** | MyInvois API `GET /api/v1.0/documents/search?invoiceDirection=Received`. OAuth2 client credentials. Receiver only sees Valid or Cancelled documents. 31-day windows, 100 per page, about 12 calls a minute, search throttled to 1 call per 5 s. |
| Verify an e-invoice is real | **Yes** | Each validated e-invoice has a UUID and a public validation link (the QR code). The app flags e-invoices it detects in receipt text. |

Important catch: most shop receipts are **consolidated e-invoices** with no buyer name, so they never reach your MyInvois account. To get an individual e-invoice you scan the QR on the receipt and request one with your TIN. Worth doing for big items (laptop, medical, tuition), not for every coffee.

Getting MyInvois credentials as an individual: you log in to the MyInvois portal with your MyTax account and register an ERP system to get a client ID and secret. LHDN's docs describe this for taxpayers generally and do not spell out the individual case, so this needs a quick test with your own login before we build on it.

`adapters/myinvois.js` has the adapter written against the real endpoints. It needs a server because the client secret cannot sit in a browser.

## Automation roadmap

### Step 1: email forwarding (biggest win, about 1 to 2 days)

Most online receipts already arrive by email: Shopee, TikTok Shop, Lazada, Grab, Unifi, TNB, insurers, clinics with e-receipts, zakat payment confirmations.

1. Get a receiving address, e.g. `receipts@yourdomain.my`, through Cloudflare Email Routing (free) to a Cloudflare Worker, or a Postmark / Mailgun inbound webhook.
2. In Gmail, add filters for those senders with "Forward to" the receipts address. Gmail filters run automatically, which is the RPA part with nothing to maintain.
3. The worker extracts text and PDF attachments, runs the same `engine.js` parser and categoriser, and stores the receipt plus the original email as proof.

### Step 2: hosted database and sync (1 to 2 days)

Move from on-device storage to Supabase (Postgres + file storage + login) so phone and laptop see the same receipts, and forwarded emails land in the same place. Row-level security so only you see your data.

### Step 3: smarter reading (1 day)

Tesseract handles clean receipts. For crumpled thermal paper and mixed Malay/English, send the image to a vision model (e.g. Claude) on the server and ask for merchant, date, line items, total and the relief category with a reason. Keep Tesseract as the free offline fallback.

Line items matter: a Guardian receipt can hold a claimable self-test kit and a non-claimable vitamin. The model can split those.

### Step 4: MyInvois pull (1 day, after credential test)

Nightly job that pulls received e-invoices through the adapter and adds them as receipts with the e-invoice UUID as proof.

### Step 5: statement matching (2 days)

Import bank or Touch 'n Go CSV statements. Payments to clinics, tadika, gyms, bookshops or Unifi with no matching receipt get flagged: "You paid Klinik X RM120 on 3 Mar, add the receipt?"

### Not recommended

- Logging in to Shopee or TikTok Shop with your password and scraping order history. It breaks their terms, breaks whenever the site changes, and risks your account. Email forwarding gets the same data safely.
- Auto-filing in MyTax with browser automation. LHDN does not allow it and errors become your liability.

## Accuracy notes

- Relief limits come from PwC's 2026/2027 tax booklet (YA 2026 column). Budget 2027 changes are proposals until the Finance Act passes, so YA 2027 uses YA 2026 limits for now.
- The tax-saved figure is an estimate using resident rates and only the RM9,000 self relief plus your receipts.
- The category suggestion is a starting point. You confirm it, and LHDN decides in an audit. Keep receipts for 7 years.
