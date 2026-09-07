# Simple Insurance — rebuild

Astro static site, rebuilt from the Figma file
(`RAMYl72ZGjXuliok58iQKF`) using the live site's copy.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
```

Astro 7, no UI framework, no Tailwind. Output is static HTML + one CSS file
+ ~4 KB of inlined JS.

## Structure

```
src/
  styles/tokens.css      ← every colour, size and radius, straight from Figma variables
  styles/global.css      ← type scale, animated CTAs, reveal primitives
  scripts/motion.js      ← reveal, parallax, cursor drift, stepper, counters
  layouts/Base.astro
  components/
    Brand.astro          ← logo + decorative quarter-disc marks
    Icon.astro           ← industry + UI icons (inline SVG)
    Nav.astro            ← floating pill nav, mobile panel
    Hero.astro
    Promise.astro
    HowItWorks.astro     ← interactive 3-step stepper
    WhoWeHelp.astro      ← 6-tile industry grid
    OurNumbers.astro     ← stat band with count-up
    WhyDifferent.astro   ← connector diagram, draw-in curves
    Simplicity.astro     ← two policy cards
    CtaPanel.astro       ← closing CTA + form
    ContactForm.astro
    Footer.astro
  pages/index.astro
```

**Never hardcode a colour or size.** Everything is a token in
`tokens.css`, named to match the Figma variable it came from. Re-export
from Figma and update that one file.

## Motion

Driven by data attributes, all wired in `scripts/motion.js`:

| Attribute | Effect |
|---|---|
| `data-reveal` | Fade + rise on entering viewport. Variants: `scale`, `left`, `right` |
| `style="--i:2"` | Stagger index — 90 ms per step |
| `data-parallax="0.1"` | Vertical drift on scroll; value is strength |
| `data-cursor-parallax="46"` | Drifts toward the cursor; value is px range |
| `data-count-to` | Counts up when scrolled into view |

Everything collapses to static under `prefers-reduced-motion: reduce`.
Cursor parallax is also skipped on coarse pointers.

The hero arrow uses `data-cursor-parallax="46"` with an eased follow
(0.075 lerp) so it drifts rather than snapping to the pointer.

## Open items

1. **How It Works steps 02 and 03** — body copy is written to match the
   voice, not taken from the live site (the stepper only renders step 01
   in static HTML). Confirm or replace in `HowItWorks.astro`.
2. **Our Numbers** — this section wasn't in the PNGs, so it's built from
   the live copy using the design system rather than matched to your
   Figma frame `896:1396`. Send it over and I'll match it.
3. **Footer "Explore" column** — Resources / For Insurers / For Brokers
   come from the Figma footer and have no destinations yet.
4. **Form endpoint** — posts to `/api/enquiry`, which doesn't exist. Wire
   to whatever the live site uses, or add an Astro server endpoint.
5. **Legal pages** — `/legals`, `/privacy`, `/terms-of-engagement`,
   `/complaints` are linked but not built.

## Compliance

The regulatory block in `Footer.astro` (broker status, general advice
warning, PDS/TMD, ABN / CAR / AFSL numbers) is carried over verbatim from
the live site. The Figma footer didn't include it. **Don't edit it
without sign-off** — it's the bit that keeps the site legal.

Same reason the Clarity & Simplicity cards use the live site's two-card
"Example only" treatment with annual pricing, rather than the Figma
frame's single card with the Allianz logo and a monthly premium.
