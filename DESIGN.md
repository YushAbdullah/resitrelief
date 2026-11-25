# Resit Relief design system

Based on the "Reliefs" screen reference: a calm, light, phone-first layout of rounded white cards on a cool grey ground, pastel icon tiles, and one indigo accent used for progress and the main action.

## Principles

1. **One number per card.** Each relief card shows the amount used in large type, a bar, and "of RMx,xxx" underneath. Nothing else competes.
2. **Indigo means progress or action.** Progress bars, the camera button, the active nav item and the YA pill use the accent. Everything else is neutral.
3. **Pastel tiles identify the relief.** Each relief keeps the same tile colour and icon on every screen (dashboard, receipt rows, detail sheets).
4. **Status is a chip, not a colour wash.** Claimable (green), Check this (amber), Not claimable (red), Example (grey).
5. **Proof first.** Every receipt keeps its photo, PDF or original text, shown in the detail sheet.

## Colour tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F6F6FA` | `#0E0F1A` | Page ground |
| `--surface` | `#FFFFFF` | `#181A2A` | Cards, nav, sheets |
| `--line` | `#E9E9F1` | `#262940` | Card borders, dividers |
| `--track` | `#E8E8EF` | `#2A2D45` | Empty progress track |
| `--ink` | `#15172B` | `#F2F2FA` | Headings, amounts |
| `--ink-2` | `#4A4D63` | `#C3C5D9` | Labels |
| `--ink-3` | `#8A8DA3` | `#8C8FA8` | Secondary text ("of RM2,500") |
| `--accent` | `#4F46E5` | `#8B84FF` | Bars, FAB, active nav |
| `--accent-soft` | `#EEEDFD` | `#24234A` | YA pill, active nav background |
| `--ok / --warn / --bad` | `#0F8A5F / #A45C00 / #B4233C` | `#4CD39A / #F5B451 / #FF7D93` | Status chips |

Icon tiles (background / glyph):

| Tone | Light | Used for |
|---|---|---|
| indigo | `#ECEBFD / #4F46E5` | Lifestyle, Life insurance & EPF |
| mint | `#E3F4EC / #11845B` | Sports, PRS, EV & green |
| peach | `#FFF0E2 / #B4610F` | Tourism & culture, Zakat |
| rose | `#FDE9EC / #C0304B` | Medical, Breastfeeding, Parents |
| sun | `#FFF3DF / #B26B00` | Childcare, SSPN |
| sky | `#E5F1FC / #1F6FB8` | Education, Insurance, SOCSO |

## Type

- **Display:** Plus Jakarta Sans 700/800. Page titles 34px, section titles 21px, card amounts 24px.
- **Body:** Inter 400/500/600. Body 15px, labels 16px, captions 13px.
- Amounts use `tabular-nums` so figures line up.
- Uppercase labels (month headers, summary label) get 0.06em letter spacing.

## Shape and spacing

| Element | Radius | Padding |
|---|---|---|
| Relief card | 26px | 20px |
| List group / panel | 22px | 16 to 18px |
| Icon tile | 14px (50px square), 12px (42px small) | |
| Pills, chips, bars | 999px | |
| Bottom sheet | 28px top corners | 20px sides |

- Page column: max 560px, 20px side gutter (safe-area aware).
- Grid: 2 columns, 16px gap (12px under 380px wide).
- Progress bar: 8px tall on cards, 6px for sub-limits.

## Components

- **Top bar:** round 52px white button on the left (opens e-receipt import, dot when something needs checking) and the YA pill selector on the right.
- **Summary card:** relief backed by receipts, estimated tax saved, receipts kept, receipts to check.
- **Relief card:** tile, name, amount, bar, "of limit". Zakat shows "paid · comes off tax payable" instead of a bar because it is a rebate.
- **Receipt row:** small tile, merchant, date · platform · relief, amount, status chip.
- **Bottom nav:** floating white pill with Overview, Claims, Discover, About you, and a raised 76px indigo camera button in the middle.
- **Bottom sheet:** used for add receipt, review form, relief detail and receipt detail. Closes on scrim tap or Escape.

## Motion

Bars ease in over 0.6s. Sheets slide up over 0.25s. All motion is off under `prefers-reduced-motion`.
