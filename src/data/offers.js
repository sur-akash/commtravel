/* =============================================================================
   The travel product shelf.

   Mirrors the real commbank.com.au/travel.html: four pillars across the journey
   — Plan & book, Pay for travel, Emergency information, Returning home — with
   every product CommBank actually showcases grouped underneath. Copy runs at
   roughly half the length of the real page and every claim is a number you can
   check.

   Each product appears in exactly ONE pillar. Where something genuinely spans
   two stages — insurance is bought when you plan and claimed when you return —
   the pillar copy references it and only one card carries it. `auditOffers()`
   at the bottom enforces that.

   Sources, all fetched and cited in the README: /travel, /travel/travel-booking,
   /travel/travel-money-card, /travel/travel-money-card/fees-charges,
   /banking/debit-cards/world-debit-mastercard, /credit-cards,
   /travel/travel-insurance, /travel/foreign-cash, /support/overseas.
   ============================================================================= */

/**
 * The four stages, used as the tab strip. `related` lists the offer ids shown
 * when that stage is selected — and every offer id appears in exactly one.
 */
export const PILLARS = [
  {
    id: 'plan',
    label: 'Plan & book',
    headline: 'Book it, and earn on the way',
    body: 'Flights, hotels and car hire in one place, with travel credits back on eligible bookings. Put prepaid travel on the right card and the insurance you already hold switches itself on. Tell us where you are going and your cards will expect it.',
    related: ['booking', 'register', 'insurance', 'steppay'],
    to: '/trip',
    cta: 'Register your trip',
  },
  {
    id: 'pay',
    label: 'Pay for travel',
    headline: 'Decide your exchange rate before you go',
    body: 'The Travel Money Card holds your rate across 16 currencies from the moment you load it, so a trip you budgeted in March still costs what you budgeted in September. Three cards charge nothing at all for spending overseas. Carry the right pair and you are covered anywhere.',
    related: ['tmc', 'wdm', 'credit', 'cash', 'fx'],
    to: '/dashboard',
    cta: 'See it working',
  },
  {
    id: 'emergency',
    label: 'Emergency information',
    headline: 'If it all goes wrong',
    body: 'Lock a card the moment it goes missing. Emergency cash within 24 to 48 hours and often the same day. A replacement card delivered anywhere in the world. A person on the phone, 24/7, with the charges reversed.',
    related: ['lock', 'emergency', 'atm'],
    to: '/emergency',
    cta: 'Open the panel',
  },
  {
    id: 'return',
    label: 'Returning home',
    headline: 'Nothing left hanging',
    body: 'Unused balance converts back at a rate you can see first. Make a claim on cover you activated before you left. Purchase protection follows the things you bought abroad, and your travel credits carry on — with an expiry we will tell you about.',
    related: ['claims', 'unwind', 'purchase', 'yello'],
    to: '/benefits',
    cta: 'Check your wallet',
  },
]

/**
 * The shelf. `featured` marks the three products that actually decide how a
 * trip goes; `art` picks an illustration from components/CardArt.jsx.
 */
export const OFFERS = [
  /* ---------------------------------------------------------------- Pay --- */
  {
    id: 'tmc',
    featured: true,
    art: 'tmc',
    icon: 'coins',
    badge: 'No load or reload fee',
    name: 'Travel Money Card',
    stat: '16',
    statLabel: 'currencies, each locked at your rate',
    body: 'Load before you go and the exchange rate is yours, whatever the market does next. Budget in real numbers instead of guessing what your money will be worth when you land.',
    points: [
      '$0 to load, reload, close or leave sitting idle',
      'AUD $3.50 per overseas ATM withdrawal',
      'Comes as two cards, so you can keep a spare',
    ],
    cta: 'Lock a rate',
    to: '/trip',
  },
  {
    id: 'wdm',
    featured: true,
    art: 'wdm',
    icon: 'card',
    badge: '$0 international transaction fee',
    name: 'World Debit Mastercard',
    stat: '$0',
    statLabel: 'at any overseas ATM, anywhere',
    body: 'Your own money, the rate of the day, and nothing added on top — including at every ATM you find. The card for everywhere your Travel Money Card cannot reach.',
    points: [
      '0% international transaction fee',
      'Two complimentary lounge visits a year',
      'Included international travel insurance, up to 21 days a trip',
      '$10 a month',
    ],
    cta: 'Compare the cards',
    to: '/trip',
  },
  {
    id: 'credit',
    featured: true,
    art: 'credit',
    icon: 'wallet',
    badge: 'Ultimate & Smart Awards',
    name: 'Travel credit cards',
    stat: '0%',
    statLabel: 'international transaction fee on both',
    body: 'Most credit cards quietly add around 3% to everything you buy overseas. These two add nothing — and they carry the travel insurance and the lounge passes.',
    points: [
      'Ultimate Awards: two complimentary lounge passes a year, up to 3 Awards points per $1',
      'Smart Awards: up to 1.5 points per $1, monthly fee waived at $2,000 of spend',
      'Included international travel insurance on both, once activated',
      'Monthly fee waived at $4,000 (Ultimate) or $2,000 (Smart)',
    ],
    cta: 'See which to pack',
    to: '/trip',
  },
  {
    id: 'cash',
    art: null,
    icon: 'coins',
    badge: 'Rate locked when you order',
    name: 'Foreign cash',
    stat: '30+',
    statLabel: 'currencies to order and collect',
    body: 'For the places that still want notes. Order online and the retail rate is locked the moment you submit, then collect from the branch you choose.',
    points: [
      'Order online with BPAY, PayID or an Australian debit card',
      'Ready for collection in 5 business days',
      '1% of the order, minimum $10',
      '$500 to $10,000 per 24 hours',
    ],
    cta: 'Check today’s rates',
    to: '/trip',
  },
  {
    id: 'fx',
    art: null,
    icon: 'refresh',
    badge: 'Live rates',
    name: 'Exchange rates & calculator',
    stat: '3',
    statLabel: 'ways the same purchase can be priced',
    body: 'Any calculator tells you what your dollar buys. Ours also tells you what it costs on each card — which is the part that decides what you pack.',
    points: [
      'Compare locked against live, per currency',
      'Set an alert on a rate you want',
      'See the cost of letting a terminal bill you in dollars',
    ],
    cta: 'Open the calculator',
    to: '/trip',
  },

  /* --------------------------------------------------------------- Plan --- */
  {
    id: 'booking',
    art: null,
    icon: 'plane',
    badge: 'Up to 10% back',
    name: 'Travel Booking',
    stat: '10%',
    statLabel: 'back in travel credits, at Yello Diamond',
    body: 'Flights, hotels and car hire through Hopper, inside your banking app. Book here and the spend counts toward switching your insurance on.',
    points: [
      'Yello Diamond 10% back, Gold 5%, Plus 5% on hotels',
      'A price drop within 10 days gives you up to $50 back in credits',
      'Travel credits last two years',
      'Pay with Awards points, all or part',
    ],
    cta: 'Plan a trip',
    to: '/trip',
  },
  {
    id: 'register',
    art: null,
    icon: 'pin',
    badge: 'Two minutes',
    name: 'Register your trip',
    stat: '3',
    statLabel: 'questions — where, when, who',
    body: 'Tell us where you are going and your cards stop treating you as suspicious the moment you land. Here it also builds a checklist that fills itself in.',
    points: [
      'Card and passport expiry checked against your return date',
      'Emergency numbers localised to where you are',
      'Nothing to tick — it answers itself from what we already hold',
    ],
    cta: 'Register now',
    to: '/trip',
  },
  {
    id: 'insurance',
    art: null,
    icon: 'shield',
    badge: 'Included, once activated',
    name: 'Travel insurance',
    stat: '21',
    statLabel: 'days of cover per trip',
    body: 'Included with eligible cards, underwritten by Zurich and arranged through Cover-More. It does not switch itself on — that part is still yours to do.',
    points: [
      'Credit card cover activates after $500 of prepaid travel in one transaction',
      'Covers your spouse and up to 10 accompanied children',
      'Unlimited overseas emergency medical assistance',
      'Standalone CBA Travel Insurance if your card does not include it',
    ],
    cta: 'Activate cover',
    to: '/benefits',
  },
  {
    id: 'steppay',
    art: null,
    icon: 'card',
    badge: 'Pay in four',
    name: 'StepPay & personal loans',
    stat: '4',
    statLabel: 'instalments, or a fixed-rate loan',
    body: 'Two ways to spread the cost of a trip you have already decided on. Both work with Travel Booking.',
    points: [
      'StepPay splits eligible purchases into four instalments',
      'A personal loan fixes the repayment before you book',
      'Either way the spend still counts toward activating your cover',
    ],
    cta: 'Plan a trip',
    to: '/trip',
  },

  /* ---------------------------------------------------------- Emergency --- */
  {
    id: 'lock',
    art: null,
    icon: 'lock',
    badge: 'Instant, reversible',
    name: 'Lock, block or limit',
    stat: '1',
    statLabel: 'tap to freeze a card',
    body: 'Lock a card the second it goes missing and unlock it when it turns up in the other coat. Nothing is cancelled, so nothing you have set up breaks.',
    points: [
      'Works on debit, credit and Travel Money Card',
      'Block overseas or online use separately',
      'Set a lower limit while you travel',
    ],
    cta: 'Open emergency',
    to: '/emergency',
  },
  {
    id: 'emergency',
    art: null,
    icon: 'phone',
    badge: 'Available 24/7',
    name: 'Emergency cash & support',
    stat: '24–48h',
    statLabel: 'to emergency cash, often same day',
    body: 'Cash in your hand, a card in the post and a person on the phone — wherever you are and whatever time it is where you are.',
    points: [
      'Replacement card anywhere in the world, $20',
      'Reverse the charges on +61 2 9999 3283',
      'Cover-More emergency assistance on +61 2 8907 5641',
    ],
    cta: 'See what happens',
    to: '/emergency',
  },
  {
    id: 'atm',
    art: null,
    icon: 'pin',
    badge: 'Surcharge flagged',
    name: 'Find cash near you',
    stat: '$3.50',
    statLabel: 'our fee — the operator’s varies',
    body: 'Ours is the same at every overseas ATM, so it is not a decision. The operator’s own surcharge is, and it differs between machines two minutes apart.',
    points: [
      'Search any city or suburb',
      'Surcharge-free machines marked green',
      'Partner branches shown alongside',
    ],
    cta: 'Open the map',
    to: '/emergency',
  },

  /* ------------------------------------------------------------- Return --- */
  {
    id: 'claims',
    art: null,
    icon: 'shield',
    badge: 'Cover-More',
    name: 'Make a claim',
    stat: '3',
    statLabel: 'ways to reach them',
    body: 'If something went wrong, claim on the cover you activated before you left. Zurich underwrites it; Cover-More handles the claim.',
    points: [
      'From Australia, 1300 467 951',
      'From overseas, +61 2 8907 5060',
      'Emergencies, 24/7, +61 2 8907 5641',
    ],
    cta: 'Check your cover',
    to: '/benefits',
  },
  {
    id: 'unwind',
    art: null,
    icon: 'refresh',
    badge: 'See the rate first',
    name: 'Unused balance',
    stat: '$0',
    statLabel: 'to close a Travel Money Card',
    body: 'Whatever is left converts back at a rate shown before you confirm. Leaving it there costs nothing either — there is no inactivity fee.',
    points: ['No closure fee', 'No inactivity fee', 'Keep it loaded for the next trip'],
    cta: 'See your balances',
    to: '/dashboard',
  },
  {
    id: 'purchase',
    art: null,
    icon: 'bag',
    badge: 'Covers what you bought',
    name: 'Purchase protection',
    stat: '90',
    statLabel: 'days of loss, theft and damage cover',
    body: 'Price Guarantee, Purchase Security and Extended Warranty are framed as shopping benefits. They cover the camera you bought in Ginza too.',
    points: [
      'Claim the difference on purchases over $75 cheaper elsewhere',
      'Extended Warranty adds up to a year',
    ],
    cta: 'Open your wallet',
    to: '/benefits',
  },
  {
    id: 'yello',
    art: null,
    icon: 'lounge',
    badge: 'Yello Diamond',
    name: 'Yello & Awards',
    stat: '18,420',
    statLabel: 'Awards points ready to use',
    body: 'Travel credits and points that already exist on your account, with an expiry date nothing currently shows you.',
    points: [
      'Travel credits expire two years after they are earned',
      'Transfer points to partner frequent flyer programs',
      'Two complimentary lounge visits a year on eligible cards',
    ],
    cta: 'See your credit',
    to: '/benefits',
  },
]

/**
 * Guides and tools, mirroring the real page's "other helpful tips" and
 * "we can help" modules. Reading and doing, rather than products.
 */
export const SUPPORT_LINKS = [
  {
    icon: 'info',
    title: 'A money checklist before you fly',
    body: 'What to load, what to activate and what to tell us — in the order that makes each one easy.',
    cta: 'Open the checklist',
    to: '/trip',
  },
  {
    icon: 'alert',
    title: 'Always choose the local currency',
    body: 'Overseas terminals offer to bill you in dollars at their own rate. It always costs more. Here is exactly how much, on your own numbers.',
    cta: 'Try the calculator',
    to: '/trip',
  },
  {
    icon: 'pin',
    title: 'Register with Smartraveller too',
    body: 'The government’s own advice for where you are going, and a record that you are there. Separate from telling your bank, and worth two minutes.',
    cta: 'Start with your trip',
    to: '/trip',
  },
]

export function offersById(ids) {
  return ids.map((id) => OFFERS.find((offer) => offer.id === id)).filter(Boolean)
}

/**
 * Catches the two mistakes this file is prone to: a product listed under two
 * pillars, or one that exists but is unreachable because no pillar names it.
 * Called by the shelf in development.
 */
export function auditOffers() {
  const seen = new Map()
  for (const pillar of PILLARS) {
    for (const id of pillar.related) {
      if (!OFFERS.some((offer) => offer.id === id)) return `${pillar.id} references missing offer "${id}"`
      if (seen.has(id)) return `"${id}" appears in both ${seen.get(id)} and ${pillar.id}`
      seen.set(id, pillar.id)
    }
  }
  const orphans = OFFERS.filter((offer) => !seen.has(offer.id)).map((offer) => offer.id)
  return orphans.length ? `not in any pillar: ${orphans.join(', ')}` : null
}
