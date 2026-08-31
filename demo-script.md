# CommTravel — 90-second demo

A click-through for pitching. Times are cumulative. Everything below works from a cold load with no setup.

**Before you start:** hit **Reset demo** in the footer. That clears saved state and reseeds the simulator, so the run is identical every time.

---

### 0:00 — Open on `/` with the state switcher on **No trip**

> "This is what a CommBank customer sees today. They've registered a trip through NetBank — destination, dates, who's travelling. The bank uses it to stop the fraud rules declining them, and gives them nothing back."

The hero card reads *No trip registered*. Everything downstream is switched off.

### 0:08 — Scroll to the offer shelf

> "Everything they already sell, on one shelf, each card leading with the number rather than the adjective. Sixteen currencies. Zero. Twenty-four to forty-eight hours."

Click **Pay for travel**. The shelf filters to the four paying products.

### 0:16 — Keep scrolling to the globe

Say nothing. Let a few lights land.

> "Every mark is a CommBank customer tapping a card somewhere overseas, right now. A travel page can *claim* the card works abroad. This is the only thing that demonstrates it."

Grab the globe and spin it — it drags like any globe.

Point at the counter: 126 countries in the last hour, against 114 on average. Then at the two panels that aren't the usual fintech furniture:

> "Fees not charged today — that's four hundred thousand dollars a 3% card would have taken, and didn't. And the sixteen currencies the Travel Money Card holds, lighting up as people spend them. The dark ones are the currencies it can't cover — the product is honest about its own edges."

### 0:26 — Click **Register a trip**, walk the three steps

Search **Tokyo** (or tap the chip) → dates → two travellers. Don't dwell; it's three questions.

> "Same three questions the bank already asks. Watch what they're worth if you actually use them."

On the last step, point at *What you get for telling us*.

**Optional aside, 5 seconds:** on step one, search **Seoul**. A warning appears — Korean won isn't one of the 16 currencies the card holds. The product knows its own limits. Search **bali** too: it finds Denpasar, because that's what people actually type.

### 0:38 — Land on the trip page. The checklist has already filled itself in

> "Nobody ticked these. Currency loaded and locked, card valid past the return date, passport with six months clear — all answered from data the bank already holds. Card and passport expiry are checked against the *return* date, not today's."

Two items are amber: insurance isn't activated, and the second physical card is sitting in a drawer unactivated.

> "CommBank issues the Travel Money Card as a pair. Nobody activates the spare. It's useless in Tokyo like that."

### 0:46 — Scroll to **You locked, they float**

> "This is the thing no neobank can offer, and it's currently a bullet point on a fees page."

Read the sentence aloud:

> **"You locked ¥ at 96.20. It's 94.10 today. You're A$38.28 ahead."**

The live rate is ticking while you say it.

### 0:54 — Switch the state to **In Tokyo, day 4**, then go to `/dashboard`

Say nothing for three seconds. Let a transaction land on its own.

> "No button was pressed. This is what day four looks like."

### 1:00 — Point at one receipt

> "Local amount first, because that's what you just handed over. AUD underneath. The rate, named as your locked rate. And the fee — shown *even though it's zero*. That zero is the entire product, and today it appears nowhere."

The running counter at the top of the feed is climbing.

### 1:08 — Inject **Merchant offered to charge in AUD**

> "The terminal in Don Quijote offers to bill you in dollars. It looks helpful. It's a worse rate the merchant sets."

The receipt shows both numbers side by side: A$16.19 against A$15.38.

> "You'd never have seen the A$16.19. Now you do."

### 1:18 — Inject **Declined — currency not on the card**

> "This is the honest version. Korean won isn't one of the 16 currencies the card holds — so there's nothing to fall back on, and the answer isn't 'load won', it's 'use the other card in your wallet, which has no international fee'."

### 1:28 — Hit **Get help**, bottom right

> "This is always one tap away while a trip is running."

Lead with the stat — **24–48 hours**, emergency cash anywhere in the world. Tap **Lock**; the card locks with the state change visible.

Then scroll to the cash locator. Drag it around, then search **bali** — the whole map regenerates around Denpasar, with Indonesian banks and rupiah surcharges.

> "Green pins take no surcharge, amber ones do. CommBank's $3.50 is the same at every ATM on earth, so it isn't a decision — the operator's fee is, it's different at machines two minutes apart, and nothing tells you before you walk there."

> "A neobank gives you a chat window. This is branches, a card network, a cash arrangement and someone answering the phone at 3am. It's the one part of the argument an incumbent wins outright — and it's currently filed under Support."

### 1:36 — Inject **Large purchase — activates your cover**, watch the right column

The benefits bar advances **while the transaction lands**.

> "That's a Shinkansen booking crossing the $500 prepaid-travel threshold. The insurance the customer already pays for just switched on, and the receipt is honest that putting it on the credit card cost them 3% to get there."

### 1:44 — Land on `/benefits`

> **"You're A$180.00 short of activating your included cover."**
>
> "That's the whole thesis in one line. The cover exists. It's paid for. Nothing tells them."

---

## Backup material

**If asked "is this real data?"** — No. Every balance, rate and transaction is generated by a seeded simulator; same seed, same demo, every time. The *product facts* are real and cited in the README: the $3.50 ATM fee, the 16 currencies, the $500 threshold, the two lounge visits, the 24/7 number.

**If asked about the build** — Vanilla Vite and React, no backend, no API keys, no network call at runtime. The whole theme is one token file. It deploys by dragging a folder onto Netlify.

**If asked about the globe** — hand-rolled orthographic projection on a 2D canvas. No WebGL, no globe library. Drag or arrow keys to turn it. The coastline is Natural Earth, decoded at build time and pre-cut into 15° tiles so partly-hidden landmasses close cleanly against the limb; there's a diagnostic script that measures exactly how badly it goes without that.

**If asked what's hardest** — Not the interface. Getting the rate-lock ledger to be honest when the lock is *losing*. The tile goes red and says so. A scoreboard you can only win isn't a scoreboard.

**If you have another 30 seconds** — drag a row in the currency stack. The sentence underneath rewrites itself: *"If you tap in a currency you haven't loaded, we'll use your ¥ balance next."* That behaviour exists today, buried in a PDS. Here you can grab it.

**Accessibility, if it comes up** — tab through it. Every control is reachable, the currency stack reorders with arrow keys as well as by drag, the feed announces arrivals through `aria-live`, and the whole thing stops moving under `prefers-reduced-motion`. Yellow is never used as a text colour; it fails contrast on white and there's deliberately no token that would let you.
