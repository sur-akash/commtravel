Build a static, deployable-to-Netlify concept prototype of a redesigned **CommBank Travel portal**. This is an unofficial product concept for a portfolio pitch, not affiliated with Commonwealth Bank. Put a small persistent disclaimer in the footer: "Unofficial concept prototype. Not affiliated with or endorsed by Commonwealth Bank of Australia. All data simulated."

## Stack and constraints

- Vanilla HTML + CSS + JS, or Vite + React if you prefer — no backend, no build step that needs env vars.
- Everything runs from static files. Must work by dragging the output folder into Netlify, and must include a `netlify.toml` with the correct publish dir and a SPA redirect if routing is client-side.
- No API keys, no external data calls. All FX rates, transactions and balances are **local mock data** in a single `src/data/` folder so I can tune numbers without touching components.
- Mobile-first, then desktop. The dashboard has to look right at 390px wide.
- Use `localStorage` to persist the simulated trip state across reloads, with a visible "Reset demo" control.
- Accessible: real semantic HTML, keyboard-operable controls, `aria-live` on the streaming transaction feed, WCAG AA contrast (CommBank yellow on white fails — never put yellow text on white).

## Reference material — read these before writing any code

Fetch and study these. Match the first group's visual language; steal the second group's interaction model.

**CommBank — design philosophy, tone, and current product truth (match this look):**
- https://www.commbank.com.au/travel.html
- https://www.commbank.com.au/travel/travel-money-card.html
- https://www.commbank.com.au/travel/travel-money-card/fees-charges.html
- https://www.commbank.com.au/banking/debit-cards/world-debit-mastercard.html
- https://www.commbank.com.au/travel/travel-insurance.html
- https://www.commbank.com.au/travel/foreign-cash.html
- https://www.commbank.com.au/international/foreign-exchange-calculator.html
- https://www.commbank.com.au/international/foreign-exchange-rates.html
- https://www.commbank.com.au/commbank-yello.html
- https://www.commbank.com.au/support/overseas.html
- https://www.commbank.com.au/digital-banking/commbank-app.html

**Up Bank — the interaction model to emulate (this is the target UX):**
- https://up.com.au/
- https://up.com.au/bank-overseas-without-the-fees/
- https://up.com.au/spending/
- https://up.com.au/multiplayer/

**Other neobanks — for the feature gap only, do not copy their visual style:**
- https://www.revolut.com/travel/
- https://www.revolut.com/esim/global-esim/
- https://wise.com/au/travel-money/

## Design philosophy — stick to CommBank

Sample the actual colours and type from commbank.com.au rather than guessing.

- **Palette:** CBA yellow `#FFCC00` as the primary brand and CTA colour, black `#000000` for the diamond mark and headings, white page background, a light warm grey for section bands, and a restrained supporting set for status (green = confirmed/ahead, amber = attention, red = alert). Yellow is used for buttons and accents, never for body text or large fills.
- **Type:** clean humanist sans (CBA uses a proprietary face — use a close free substitute such as Inter or Public Sans). Large light-weight display headings, generous line height, sentence case throughout. Never all-caps headings — that's Up's voice, not CBA's.
- **Layout:** wide whitespace, clear horizontal section bands, 12-column grid, cards with subtle borders rather than heavy shadows, rounded corners around 8px. Reference the density of the current travel page but cut the copy length by half.
- **Iconography:** flat single-colour line pictograms in the CBA style, not emoji, not gradient illustrations.
- **Tone of voice:** plain, calm, second person, short sentences. "Your yen is loaded." Not "Yeeew, you're all set!" Keep the Up-style energy in the *motion* and *data density*, not the copy.
- Build a proper token layer (`tokens.css` with CSS custom properties for colour, spacing, radius, type scale) so the whole thing is themeable in one file.

## Information architecture

Single-page app with these routes/sections:

1. `/` — Travel home. Hero, then a **trip state switcher** so a demo viewer can jump between three states: **No trip**, **Trip in 18 days (Tokyo)**, **In Tokyo, day 4**. Every module below reacts to that state.
2. `/dashboard` — **the live transaction dashboard** (see full spec below). This is the centrepiece.
3. `/trip` — Trip object detail: checklist, currencies, benefits, documents.
4. `/benefits` — Travel benefits wallet.
5. `/emergency` — Stranded-proof panel.

## The five feature modules

### 1. Trip object ("Register your trip", reimagined)
Today CBA collects destination and dates via NetBank purely for fraud rules and gives the customer nothing back. Make it the spine.

Build a 3-step register-trip flow (destination, dates, who's travelling) that produces a live Trip card showing: countdown, destination currency and whether it's loaded, insurance activation state, card expiry checked against the return date, passport expiry checked against the return date, lounge passes remaining, and localised emergency contacts. A self-ticking checklist that marks items complete from held data rather than asking the user to tick them.

### 2. Rate-lock ledger — "you locked, they float"
CBA's Travel Money Card locks the rate at load time across 16 currencies. No neobank can offer this. Show it as a scoreboard, not a bullet point.

Per currency held: rate locked, live rate now, and the AUD delta ("You locked ¥ at 96.2. It's 94.1 today. You're A$38 ahead"). Include a sparkline of the last 30 days, a live rate ticker for the destination currency, a "set a rate alert" control, and an inline **Load currency** modal that executes without leaving the page.

### 3. Confidence layer — "will my card work here?"
- **Drag-to-reorder currency stack** showing exactly what happens on a tap when the local currency isn't loaded — animate the fallback to the next available currency.
- **DCC explainer** as a first-class card, not an FAQ: "always choose the local currency" with a side-by-side cost comparison.
- **Backup card** — CBA issues two physical cards. Surface the second card's status prominently.
- **Card comparison strip** for the destination: Travel Money Card (AUD $3.50 overseas ATM withdrawal, rate locked, 16 currencies) vs World Debit Mastercard ($0 international transaction fee, $0 at any overseas ATM, $10/month, lounge passes) vs credit card. Show which one to pack for *this* trip.
- ATM locator map placeholder with surcharge flags.

### 4. Stranded-proof emergency panel
CBA can deliver an emergency replacement card anywhere in the world often within 48 hours and emergency cash often same day, with a 24/7 reverse-charges line. Neobanks are chat-only. Make it a persistent, always-reachable panel while a trip is active: lock card (with an animated lock state), request emergency cash, request replacement delivery, call reverse charges, nearest branch/partner. Lead with the promise as a headline stat.

### 5. Benefits wallet
Show entitlements with activation state and expiry, and quantify the gap:
- Included international travel insurance, requiring activation, and for credit cards requiring $500 of prepaid travel costs charged to the card. Show a progress bar: "You're $180 short of activating your included cover."
- Two complimentary Mastercard Travel Pass lounge visits per year on the World Debit Mastercard, with a used/remaining counter.
- Yello travel credits (up to 10% back on Hopper bookings, 2-year expiry) and Yello points with transfer partners.
- Price Guarantee, Purchase Security, Extended Warranty framed as travel cover.

---

## THE LIVE TRANSACTION DASHBOARD — full spec

This is the piece to spend the most effort on. It is the Up Bank "Travel Easy" experience rebuilt in CommBank's visual language. It must feel alive on load, with no user action required.

### Simulation engine
- A seeded, deterministic transaction simulator in `src/data/simulator.js`. Same seed = same demo every time.
- Scenario: **Tokyo, day 4 of 9.** Card is a Travel Money Card with JPY, USD and AUD loaded. Base FX: JPY locked at 96.2/AUD, live market drifting around 94.1 with realistic minute-to-minute jitter (random walk, ±0.15% per tick, clamped).
- Transactions arrive on a timer (one every 6–9 seconds), drawn from a realistic Tokyo merchant set: Lawson, JR East ticket machine, Ichiran Ramen, Don Quijote, Suica top-up, 7-Eleven ATM, teamLab Planets, Uniqlo Ginza, a taxi, a konbini.
- Controls: **play / pause**, **speed 1× / 4× / 16×**, **"Inject event"** dropdown to fire specific demo moments on demand, and **reset**.
- Injectable events: a DCC-flagged transaction, an ATM withdrawal with a third-party surcharge, a declined transaction because the currency isn't loaded, a large purchase that crosses the insurance activation threshold, a duplicate/suspicious charge.

### The transaction receipt — the core visual object
Every arriving transaction animates in at the top of the feed and expands. It must show, in this order:

1. Merchant name + category pictogram + local time.
2. **Big local currency amount** as the primary figure: `¥1,480`
3. **AUD equivalent** directly beneath, secondary weight: `A$15.38`
4. **Rate applied**, explicit: `Converted at 96.20 JPY/AUD (your locked rate)`
5. **Fee line, always shown, even when zero**: `International transaction fee: $0.00` — this is the whole point, make zero visible.
6. **Which currency bucket it came from**, e.g. `Paid from your ¥ balance`.
7. A **savings chip** comparing against a typical 3% foreign transaction fee: `Saved A$0.46 vs a standard card`.
8. Running counter at the top of the feed: **total saved this trip**, ticking up with each transaction.

Special receipt states:
- **DCC-flagged:** amber banner. "This merchant offered to charge you in AUD at 91.4. You'd have paid A$16.19 instead of A$15.38. You chose local currency and saved A$0.81." Include a dismissible explainer link.
- **ATM withdrawal:** show CBA's AUD $3.50 fee *and* the third-party operator surcharge as separate lines, then a note that a World Debit Mastercard would have been $0 at this ATM.
- **Declined — currency not loaded:** red state, with an inline "Load KRW now" CTA and a plain explanation of the next-available-currency fallback.
- **Suspicious:** inline "Was this you?" with Yes / No / Lock card.

### Dashboard layout (mobile-first, stacked; desktop 2-column)

**Top: dual-currency balance header (Up's Travel Mode).**
Primary figure in local currency, secondary in AUD, with the live rate between them and a pulse animation on each rate tick. A toggle flips which currency is primary. Include a small "Travel Mode is on" state chip.

**Second: the currency stack.**
Horizontal cards for each loaded currency showing balance, locked rate, live rate, and the AUD delta with a green/red arrow. Drag to reorder the fallback priority; reordering animates and updates a plain-language line beneath: "If you tap in a currency you haven't loaded, we'll use your ¥ balance next."

**Third: spend so far.**
- Budget ring: spent vs trip budget, with days remaining and a projected end-of-trip figure.
- Spend by category (small horizontal bars, no pie charts).
- Spend by day sparkline.
- "Ahead/behind on FX" tile: the rate-lock delta in dollars for the whole trip.

**Fourth: the live feed.** Reverse chronological, newest animating in from the top with a short slide+fade. Group by day with sticky day headers. Infinite-ish, cap at 50 in DOM.

**Right column on desktop / below on mobile:** the emergency panel, the benefits wallet progress, and the trip checklist, all reacting to feed events (e.g. the large purchase event advances the insurance activation bar in real time).

### Micro-interactions that sell it
- Rate ticker updates every 3 seconds with a subtle number roll, never a jarring flash.
- A "you just saved" toast on transactions with a meaningful saving.
- Haptic-style scale bounce on the running savings counter.
- Everything respects `prefers-reduced-motion`.

---

## Deliverables

- Working site, `npm run dev` and `npm run build`.
- `netlify.toml`.
- `README.md` with the concept pitch in 10 lines, the five modules, a "what's simulated" section, and deploy steps.
- A `/demo-script.md` with a 90-second click-through path for pitching: register trip → see checklist self-tick → jump to dashboard → watch three transactions land → inject the DCC event → inject the declined event → open emergency panel → show benefits gap.

Build the design tokens and the simulator first, then the dashboard, then the other four modules. Show me the token file and one finished transaction receipt component before building the rest, so I can check the visual direction early.
