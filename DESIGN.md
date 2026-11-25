# Resit Relief design system (v2, "mint fintech")

Based on Yusri's second reference: an airy fintech landing page with a faint mint wash, a heavy black geometric headline, a light-green call-to-action, frosted white cards with soft green-tinted shadows, little tilted stat chips, thin hand-drawn green line doodles, and a transaction list with green (good) and red (bad) amounts.

The app keeps every feature from v1 (scan, paste, categorise, relief limits, proof, export). Only the look and the page layout changed.

## Principles

1. **Air first.** Lots of mint-white space. Colour comes from soft gradient glows behind the content, never from solid coloured blocks.
2. **One loud thing per screen.** The black headline (desktop hero, page titles) is the loudest element. Everything else is quiet grey text on frosted white.
3. **Green means good.** Light green is the main action (Scan a receipt). Deep green fills progress bars and marks claimable amounts. Red is only for "Not claimable", amber only for "To check".
4. **Playful, not childish.** Stat chips sit slightly tilted. Receipt rows in the overview tilt by about a degree, like paper slips. Doodles are thin, sparse and never behind text.
5. **Proof first.** Every receipt still opens to its photo, PDF or text.

## Layout and UX

### Desktop (960px and up)
- **Header:** two-circle logo mark (green and black) with the wordmark on the left, section links centred (Overview, Claims, Discover, About you; the active one is underlined in green), and on the right the YA pill, a bell with a red dot when receipts need checking, and a round avatar.
- **Hero, two columns.** Left: three tilted stat chips (relief found, tax saved, to check), a curly arrow doodle, the headline "Every receipt, ready for LHDN", a short paragraph, then a green **Scan a receipt** button and an underlined **Paste an e-receipt** link. A squiggle doodle sits underneath. Right: a stack of three cards. A black card (tax saved), a mint card (receipts kept) and a frosted receipt card in front with a fingerprint doodle, placeholder lines, a YA stamp and the relief total.
- **Your reliefs:** centred section title and one-line explanation over a soft glow, then a 4-column grid of relief cards.
- **Feature pair:** two frosted panels side by side. Left is **Recent receipts** (a transaction list with See all). Right is **Auto-import e-receipts** (green check, explanation, progress bar, two mini stat tiles, "Set up forwarding").
- Sheets open as centred dialogs.

### Phone (under 720px)
- The header keeps the logo, YA pill, bell and avatar. Section links move to a floating frosted bottom bar with a raised green rounded-square camera button in the middle.
- The hero becomes one column: chips, headline, paragraph, buttons. The card stack is hidden so the numbers stay above the fold.
- Relief grid is 2 columns, the feature pair stacks.
- Sheets slide up from the bottom.

### Tablet (720px to 959px)
3-column relief grid, the feature pair side by side, bottom bar still used.

## Colour tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F3FAF1` | `#0D120E` | Page ground |
| `--wash` | `#DDF5D6` | `#173520` | Radial glows behind content |
| `--surface` | `#FFFFFF` | `#151B17` | Chips, rows, sheets |
| `--glass` | `rgba(255,255,255,.72)` | `rgba(23,30,25,.78)` | Frosted cards (with 12px backdrop blur) |
| `--line` | `#E6EEE4` | `#243027` | Hairlines |
| `--track` | `#E3EFE0` | `#233227` | Empty progress track |
| `--ink` | `#111312` | `#F1F5F1` | Headlines, amounts |
| `--ink-2` | `#3F4541` | `#C5CEC7` | Body |
| `--ink-3` | `#8A918C` | `#87918A` | Dates, captions |
| `--green` | `#8EDC86` | `#7FD478` | CTA fill, doodles, logo dot |
| `--green-deep` | `#2FA25A` | `#5BC473` | Progress fill, check icon |
| `--green-ink` | `#1F7A3E` | `#7FD98F` | Claimable amounts, percentages |
| `--red` | `#E03A3E` | `#FF7275` | Not claimable |
| `--amber` | `#C27A00` | `#F2B54A` | To check |
| `--dark-card` | `#1C1F1D` | `#050806` | Black card in the hero stack |

Shadows are tinted green: `0 12px 32px rgba(46,98,52,.08)` for resting cards, `0 18px 50px rgba(46,98,52,.14)` when lifted.

## Type

- **Display:** Urbanist 800 (fallback Inter). Hero 40 to 64px (fluid), tracking -0.035em, line height 1.02. Section and page titles 28 to 40px. Card amounts 24px.
- **Body:** Inter 400 to 600. Body 15px, captions 12 to 13px.
- **Stat chips:** number in Urbanist 800 at 20px, label in Inter italic 13px, as in the reference.
- Money uses `tabular-nums`.

## Shape

| Element | Radius |
|---|---|
| Cards, panels | 18px |
| Hero stack cards | 20px |
| Buttons | 10px (rounded rectangle, not a full pill) |
| Stat chips | 10px |
| Receipt rows | 12px |
| Status chips | 6px |
| Icon tiles, avatar | circle |
| Bottom bar | 22px; camera button 20px |

## Components

- **Relief card:** round mint icon tile and percentage used on top, name, big amount, 6px green bar, "of RMx,xxx". Zakat shows "rebate" and "paid · comes off tax payable".
- **Receipt row:** white slip with icon, merchant (Urbanist bold), "date | platform · relief", amount on the right in green with a + for claimable, red for not claimable, amber for to check, and the status in small grey text below.
- **Stat chip:** white, small shadow, rotated -2 to -5 degrees.
- **Doodles:** inline SVG, 2px stroke in `--doodle`, round caps: curly arrow (hero), squiggle (under the buttons), blob outline (top-right of the auto-import panel).
- **Filters (Claims):** row of white pills, the active one filled black.
- **Buttons:** primary is light green with near-black text; ghost is white with a shadow; danger is a red tint.

## Motion

Cards lift 2px on hover, rows slide 2px right, the primary button rises 1px with a green glow. Bars ease in over 0.6s and sheets slide up over 0.25s. Everything is off under `prefers-reduced-motion`.

## v3 additions: dashboard, tables and carousel

- **Dashboard header:** green eyebrow "YA 2026 at a glance", headline "Hello, you have RMx in relief" with the amount on a green highlighter swash, and the Scan / Paste actions on the right.
- **KPI cards:** five cards (Relief found, Est. tax saved, Total spent, Online shopping, To check). The first is the black "hero" card from the reference; the others are frosted. On phones they become a swipeable row that snaps card by card; on desktop a 5-column row. To check turns amber and opens the filtered list.
- **Highlights carousel:** snap-scrolling slides (Monthly spending chart, Online shopping by shop, Closest to the limit, LHDN rules version) with round prev/next buttons and pill dots. One slide per view on phones, two on tablets, three on desktop.
- **Charts:** single-series green bars with 4px rounded tops, the current month in deep green, faint grid, axis text in `--ink-3`, a hover title per bar. Bars and shop rows are tappable and filter the Receipts table.
- **Receipts table:** frosted table with select checkboxes, sticky dark bulk-action bar (Download ZIP, CSV, Clear). Phones show merchant and amount; tablets add date and status; desktop adds shop, relief and proof icon.
- **Monthly table:** months down, Spent, Claimable (green), one column per shop, Proof count (with proof / total), and View / download per month, with a tinted totals row.
- **Landing page (signed out):** the v2 hero with an email magic-link form and Google button, plus three feature cards.
- **Navigation:** desktop top links Overview, Receipts, Spending, Reliefs, Account and an "Add receipt" button. Phones: bottom bar Overview, Receipts, camera, Spending, Reliefs; Account sits behind the avatar.
