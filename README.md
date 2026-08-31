# CommTravel

A concept prototype of a redesigned CommBank travel portal.

> **Unofficial concept prototype. Not affiliated with or endorsed by Commonwealth Bank of Australia. All data simulated.**

---

## The pitch, in ten lines

1. CommBank already holds the assets that win the travel-money argument.
2. The Travel Money Card locks your exchange rate at load time, across 16 currencies.
3. No neobank offers that. Not Up, not Revolut, not Wise.
4. It also delivers emergency cash within 24–48 hours, often the same day.
5. And a replacement card anywhere in the world, and a human on the phone at 3am.
6. None of this appears anywhere a customer would look. It's in PDFs and FAQs.
7. Meanwhile registering a trip — destination, dates, travellers — gives you nothing back. It only stops the fraud rules declining you.
8. So CommBank loses travellers to apps that are worse at the hard parts and better at the screen.
9. CommTravel rebuilds those same assets as a live product: Up Bank's interaction model in CommBank's visual language.
10. Nothing here needs a new capability. It needs a surface.

---

## The five modules

**1. The trip object** — `/trip`
A three-step register-trip flow that produces a live trip card: countdown, currency loaded state, insurance activation, lounge passes, localised emergency contacts. The checklist ticks itself from held data — card and passport expiry are checked against your *return date*, not today's, and you are never asked to confirm your own passport number.

**2. Rate-lock ledger and FX calculator** — `/trip`
"You locked, they float", as a scoreboard rather than a bullet point. Per currency: the rate you locked, the live rate now, and the difference in dollars — *"You locked ¥ at 96.20. It's 94.10 today. You're A$38.28 ahead."* With a 30-day sparkline, a rate alert, and an inline load-currency modal.

Above it sits a **currency converter** that does more than convert. Any site can tell you what A$1,000 buys; this one prices the same basket three ways — loaded on a Travel Money Card, spent on a card charging the usual 3%, and billed in AUD by an overseas terminal — because that gap is what decides which card you pack.

**3. Confidence layer** — `/dashboard` and `/trip`
"Will my card work here?" A drag-to-reorder currency stack showing exactly which balance pays when you tap in a currency you haven't loaded. A DCC explainer as a first-class card with a side-by-side cost comparison. The second physical card CommBank issues and nobody activates. A card comparison strip that names which one to pack for *this* trip.

**4. Stranded-proof panel** — `/emergency`
Reachable from every screen while a trip is running. Leads with the promise as a stat. Lock the card with an animated lock state, request emergency cash, request a replacement delivery, call reverse charges — plus a **before you fly** checklist, an **if this happens, do this** playbook written for someone stressed on a bad connection, and a searchable **cash locator**.

**5. Benefits wallet** — `/benefits`
What you're already owed, with activation state and expiry. *"You're A$180.00 short of activating your included cover."* That bar moves in real time when the large-purchase event lands on the dashboard.

**The travel home** — `/`
The shape of the real commbank.com.au/travel.html: a hero, a tab strip across the four stages of a trip — Plan & book, Pay for travel, Emergency information, Returning home — and every product on one shelf beneath it, each card leading with the number that matters. Selecting a stage filters the shelf. The tabs follow the ARIA tabs pattern properly: roving tabindex, arrow keys, Home and End.

**CommBank Travel Orbits** — `/`
The live global view. A globe you can drag, with a mark for every international transaction as it lands, ringed by four live panels.

It answers the one question a travel page can never answer with copy: *does this card actually work over there?* A page can claim "accepted worldwide". A mark appearing in Ubud two seconds ago demonstrates it.

Two of the four panels are deliberately **not** the obvious ones. A transactions-per-minute trend line and a top-countries bar chart are what every fintech puts here, and neither says anything a customer could act on:

- **Fees not charged today** — the product thesis as a running total. Every dollar on that counter is a dollar a card charging the usual 3% would have taken.
- **Currencies in play** — the 16 the Travel Money Card can hold, lighting up as they're spent and cooling off over about twelve seconds. It makes the rate-lock story visible rather than stated, and the chips that stay dark are exactly the currencies the card can't cover.

**The centrepiece** — `/dashboard`
A live transaction feed that is already moving when the page loads. Dual-currency balance header, currency stack, budget ring, and receipts that animate in every 6–9 seconds. Every receipt shows the fee line **even when it is zero**, because a visible `A$0.00` is the entire argument.

---

## What's simulated

Everything financial. There is no backend, no API, no network call at runtime.

| | |
|---|---|
| **Transactions** | Generated by a seeded simulator in `src/data/simulator.js`. Same seed, same demo, every reload. |
| **Balances and rates** | Local mock data in `src/data/fx.js`. JPY locked at 96.2/AUD, market floating around 94.1 on a clamped ±0.15% random walk. |
| **Merchants** | A realistic Tokyo set in `src/data/merchants.js`, filtered by what would actually be open at the current Tokyo hour. |
| **The traveller** | "Alex Nguyen", fictional. Card numbers, passport, points balance — all invented. |
| **Timings** | Trip dates are computed relative to page load, so the demo never goes stale. |
| **The global feed** | A second seeded simulator in `src/data/globalFeed.js`, weighted for Australian outbound travel — Bali, Auckland and Queenstown outrank Berlin, because that is what an Australian bank's overseas feed actually looks like. City coordinates in `src/data/globe.js` are real; amounts and rates are illustrative. |
| **Top countries** | Ordered Indonesia, New Zealand, USA, Japan, UK — the real shape of Australian outbound travel, not a generic global ranking. |

**What is *not* invented** — the product facts. Every fee, threshold, currency count and phone number below was fetched from CommBank's published pages:

- **Travel Money Card** — $0 load / reload / closure / inactivity, **AUD $3.50** overseas ATM withdrawal, 16 currencies, Visa rate **+3%** cross-currency
- **World Debit Mastercard** — **$10/month**, **0%** international transaction fee, **$0** at any overseas ATM, **2** Mastercard Travel Pass lounge visits a year, insurance up to **21 days** per trip
- **Ultimate Awards credit card** — **$35/month waived at $4,000** spend, **0%** international transaction fee, **2** complimentary lounge passes a year, up to **3** Awards points per $1
- **Smart Awards credit card** — **$19/month waived at $2,000** spend, **0%** international transaction fee, up to **1.5** points per $1
- **Travel insurance** — underwritten by **Zurich**, arranged through **Cover-More**; activates after **$500** of prepaid travel in a single transaction, or the same redeemed in Awards points or travel credits; covers spouse and up to **10** accompanied children
- **Travel Booking** — provided by **Hopper**; Yello Diamond **10%** back in travel credits, Gold **5%**, Plus **5%** on hotels; price drop within **10 days** returns up to **$50**; credits last **2 years**
- **Foreign cash** — **30+** currencies, **1%** fee (minimum **$10**), rate locked when you submit online, ready in **5 business days**, **$500–$10,000** per 24 hours
- **Purchase protection** — Price Guarantee over **$75**, Purchase Security **90 days**, Extended Warranty **+1 year**
- **Support** — 24/7 overseas line **+61 2 9999 3283** (reverse charges), Cover-More emergencies **+61 2 8907 5641**, claims **1300 467 951** / **+61 2 8907 5060**, emergency cash **24–48 hours, often same day**, replacement card **$20**

### Product coverage

The shelf carries **all 16 products and services** the real travel page showcases, grouped into its four pillars — Plan & book, Pay for travel, Emergency information, Returning home — with **each product in exactly one pillar**. `auditOffers()` in `src/data/offers.js` enforces that and warns in development if a product ends up in two pillars or none.

### Card illustrations

The three card artworks are **original vector drawings** in CommBank's colours, not lifted from commbank.com.au. The real product photography is Commonwealth Bank's copyright and this is an unofficial concept — and a vector card scales, follows the theme tokens, loads no external asset, and can carry live data on its face. Geometry is the true 85.6 × 54mm ratio.

Two places where the prototype deliberately corrects a simplification:

- **The declined receipt.** Korean won genuinely isn't one of the Travel Money Card's 16 currencies, so a "Load KRW now" button couldn't work. The receipt says so and offers the World Debit Mastercard instead — which is the real product answer.
- **The ATM receipt.** A World Debit Mastercard removes CommBank's $3.50, but *not* the operator's own ¥220 surcharge. The receipt itemises both and says which one follows you.

---

## Design

Colours and type were sampled from the live commbank.com.au with `getComputedStyle` rather than guessed:

```
brand yellow  #FFCC00     ink        #1E1E1E     deep black  #231F20
grey band     #F4F4F4     border     #706D6E     mid grey    #4F4C4D
type          CBABeaconSans → Inter · h1 40/48 w800 · body 16/24 · title case
CTA           yellow fill, #231F20 text, 24px pill, 0 24px padding
```

The whole theme is `src/styles/tokens.css`. Change a value there and it moves everywhere.

**One rule is enforced structurally:** yellow is a fill, never a text colour. `#FFCC00` on white is 1.44:1 and fails WCAG AA at every size, so there is deliberately no brand *text* token — only `--color-surface-brand`, which forces `--color-on-brand` (`#231F20`) as its partner. The one place yellow sits near text is a large figure on near-black, at 11.9:1.

Also: WCAG AA throughout, real semantic HTML, keyboard-operable everywhere (the currency stack reorders with arrow keys as well as by drag, and the offer tabs implement the full ARIA tabs pattern), `aria-live` on the transaction feed, and a global `prefers-reduced-motion` override that also stops the globe spinning.

### The cash locator

A real slippy map, not a picture of one: Web Mercator, a zoom pyramid, drag to pan, wheel or buttons to zoom with the point under the cursor staying put, and a scale bar computed from the true ground resolution at the current latitude. Features live in latitude and longitude, so everything projects properly at any zoom.

**Search anywhere.** Type a city, suburb or country and the map moves there — and regenerates. Streets, parks and cash points are all functions of a centre and a seed, so every place has its own layout and the same one each time you return. Cash points outside Tokyo are drawn from the operators that genuinely dominate that country (7-Eleven and Japan Post in Japan, BCA and Mandiri in Indonesia, Barclays and Link in the UK) with surcharges in the right currency and the right ballpark. Tokyo keeps a curated list at real coordinates.

Search understands what people actually type: *bali* finds Denpasar, *nyc* finds New York, *saigon* finds Ho Chi Minh City.

What it doesn't have is a tile server, because the brief rules out network calls. The streets underneath are **generated** — a seeded procedural network laid out in metres around the centre, then converted to lat/lon (`src/data/citymap.js`). It's a plausible city rather than a real one, and the UI says so. Swapping in a real vector source later means replacing that one file and nothing else.

The map is coloured by one thing only: **the operator's surcharge**. CommBank's AUD $3.50 is the same at every overseas ATM, so it isn't a decision. The operator's own fee is — it differs between machines two minutes apart, and nothing tells you before you walk to one.

### The globe

Hand-rolled: an orthographic projection on a 2D canvas, no WebGL and no globe library. The coastline is Natural Earth 110m, decoded from TopoJSON by `scripts/build-world.mjs` and committed to `src/data/world-land.js`, so nothing is fetched at runtime.

**Drag it.** Pointer drag turns and tilts it; auto-rotation resumes a couple of seconds after you let go. Arrow keys do the same for keyboard users (Shift for bigger steps), and the canvas is focusable.

The horizon is the whole problem, and two things solve it together. First, the coastline is **pre-cut into 15° tiles**. Drawing whole continents means deciding what to do with the half that is round the back, and both cheap answers are visibly wrong — a chord across the disc slices a lens out of the ocean, and pinning hidden points to the limb makes the Americas smear around the rim and flood the globe when Asia faces the viewer. Second, a tile crossing the horizon is cut at the limb and closed **along the limb arc, the shorter way round**. That choice is ambiguous for a whole continent, which is what broke the earlier attempts; for a tile spanning ~21° of arc the short way is always right.

Every tile is added to **one path and filled once**. Filling them individually leaves hairline seams where antialiased edges meet, and stroking them individually draws the 15° cut lines as a grid across the continents. In a single path the shared edges are traversed in opposite directions, so under the nonzero winding rule they cancel and the tiles merge into one landmass.

`scripts/debug-globe.mjs` measures the tiling — worst tile covers 1.8% of the disc, against ~100% untiled. Tiles behind the horizon are culled with one dot product against a precomputed bounding cone; the loop stops when the globe scrolls off screen or the tab is hidden; and the first frame paints synchronously so the globe is never a blank hole in a backgrounded tab.

---

## Running it

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

The build outputs to `dist/`. No environment variables, no secrets, no build-time API calls.

## Deploying to Netlify

`netlify.toml` is already configured with the publish directory and the SPA redirect that client-side routing needs.

**Drag and drop:** run `npm run build`, then drag the `dist/` folder onto Netlify.

**From Git:** connect the repository. Netlify reads `netlify.toml` and needs no further configuration.

---

## Structure

```
scripts/       build-world.mjs (regenerates the coastline) · debug-globe.mjs (diagnostic)
src/
├─ data/        the simulators and every tunable number — edit here, not in components
├─ lib/         formatting, contrast maths, Mercator, derived holdings, the checklist
├─ state/       DemoContext (persisted choices) · useSimulator (the transaction stream)
├─ styles/      tokens.css · base.css
├─ components/  primitives/ and the feature modules
└─ routes/      Home · Dashboard · Trip · Benefits · Emergency
```

Two state layers, kept apart on purpose: the **simulator** owns the transaction stream and is deterministic from a seed; **DemoContext** owns what a viewer changes while poking at it and is the only half that touches `localStorage`. **Reset demo**, in the footer of every page, clears both.

See [`demo-script.md`](demo-script.md) for a 90-second click-through.


---

## A note on tone

The site does not compare CommBank to anyone. An earlier draft had a
CommBank-versus-neobank table on the emergency page, and it was the wrong
instinct: a customer standing in a police station in Tokyo does not need to know
how a competitor would have handled it — they need to know what to press.

Everything customer-facing is now written to help rather than to win an
argument. The competitive reasoning still exists, because it is why these five
modules and not five others — but it lives in this README and in code comments,
where the audience is someone deciding whether to build it.
