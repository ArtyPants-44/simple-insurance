# Image manifest

Everything in `public/images/` is currently a **placeholder**. Drop your Figma
exports in at these exact filenames and nothing else needs changing.

| File | Used in | Figma source | Export at |
|---|---|---|---|
| `hero.mp4` | Hero background | supplied — recompressed to 1.2 MB from 2.9 MB | 1280×720, H.264, no audio, faststart |
| `hero.jpg` | Hero video poster + fallback | first frame of `hero.mp4` | 1280×720 |
| `promise-tradespeople.jpg` | Our Promise | supplied — cropped from `landscapers-tradies.png` | 1008×1200 |
| `how-consult.jpg` | How It Works — step 01 | `img/store-person-at-desk` | 724×1000 |
| `how-legwork.jpg` | How It Works — step 02 | *(needs picking)* | 724×1000 |
| `how-covered.jpg` | How It Works — step 03 | `img/cafe-owner-01` | 724×1000 |
| `cta-warehouse.jpg` | Closing CTA panel | supplied — `man-packgaing.png` | 1800×1200 |
| `og-card.jpg` | Social share card | — | 1200×630 |
| `favicon.svg` | Browser tab | `logo/symbol-default` | — |

Serve `.webp` alongside if you want; the live build already does this, and
swapping the `<img src>` extensions is a one-line change per component.

## Icons

Who We Help now uses your supplied exports, held in
`src/data/supplied-icons.js` and rendered through `Icon.astro`:

| Tile | Icon | Source |
|---|---|---|
| Consultants & Advisory Professionals | `briefcase` | **still my drawing — needs an export** |
| Construction Consultants & Professionals | `construction` | supplied |
| Commercial Property Owners & Landlords | `commercial-property` | supplied |
| Real Estate Agencies & Property Managers | `house` | supplied |
| Not-for-Profits & Associations | `charity` | supplied |
| Mining & Resources Professionals | `mining` | supplied |

Colour attributes were stripped on import. The group sets
`fill="currentColor"`, so each icon takes its colour from the tile — white
here, but they'll work on any surface without a second export.

Two of the five (`mining`, `commercial-property`) arrived with no fill
attribute at all and would have rendered black on the dark tiles.

**Outstanding:** the supplied icons are filled shapes; my `briefcase` is a
2px stroked drawing, so it reads lighter than the other five sitting next to
it. Send a consultants/advisory export and the set is consistent.

### Why We Are Different chips

| Chip | Icon |
|---|---|
| Heavy jargon | `jargon` |
| 63 Documents | `documents` |
| Time Consuming | `time-consuming` |
| Rotating Account Managers | `account-manager` |

All supplied. These previously borrowed industry icons as placeholders.

To re-import, re-run the extraction rather than editing path data by hand.


## Logo

Done — `src/components/Brand.astro` now carries the real outlined paths
from `logo-2-colour.svg`. Type is outlined, so there's no font dependency.

It's inlined rather than referenced as a file so the wordmark and symbol
can be recoloured per surface from one source:

| Variant | Renders |
|---|---|
| `logo` | Full lockup. `tone="light"` puts "insurance" in white for dark backgrounds |
| `symbol` | Mark only, as authored — green tile, dark S, white dot |
| `symbol-invert` | White tile, green S, dark dot — used for the glowing mark in Why We Are Different |

`favicon.svg` is generated from the same symbol paths.

The Our Promise shape group is your `shape-horizontal.svg`, inlined in
`Promise.astro` with the two fills mapped to `--c-primary-700` and
`--c-primary-500` instead of hardcoded hex.

Still redrawn: the `leaves` and `quarter-dot` eyebrow marks. Low priority —
they're simple quarter-disc geometry and read correctly.

## Fonts

Manrope and Inter load from Google Fonts in `src/layouts/Base.astro`. For a
faster LCP, self-host them: `npm i @fontsource-variable/manrope
@fontsource-variable/inter` and swap the `<link>` for imports.
