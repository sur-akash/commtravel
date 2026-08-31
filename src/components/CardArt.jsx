/* =============================================================================
   CardArt — the physical cards, drawn.

   These are ORIGINAL vector illustrations in CommBank's colours, not lifted
   from commbank.com.au. Two reasons, and the second matters more than the first:
   the real product photography is Commonwealth Bank's copyright and this is an
   unofficial concept, and a vector card scales, follows the theme tokens, has
   no external asset to load, and can carry live data on its face.

   Geometry is the real thing: 85.6 × 54mm, so the aspect ratio is right, with
   the corner radius and chip placement in proportion.
   ============================================================================= */

import { DiamondMark } from './primitives/Icon.jsx'
import './CardArt.css'

/* Card dimensions in the SVG's own units, at the true 1.586:1 ratio. */
const W = 342
const H = 216
const R = 18

function Chip({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} opacity="0.9">
      <rect width="34" height="26" rx="5" fill="#D8C48A" />
      <path
        d="M0 8h11M0 18h11M34 8H23M34 18H23M11 0v26M23 0v26"
        stroke="#A8925C"
        strokeWidth="1.4"
        fill="none"
      />
    </g>
  )
}

function Contactless({ x, y, colour }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke={colour} strokeWidth="2.2" strokeLinecap="round" opacity="0.75">
      <path d="M0 4a9 9 0 0 1 0 12" />
      <path d="M5 0a15 15 0 0 1 0 20" />
      <path d="M10 -4a21 21 0 0 1 0 28" />
    </g>
  )
}

/**
 * One card face.
 *
 * `tone` picks the palette:
 *   brand  — CommBank yellow, near-black type (the Travel Money Card)
 *   ink    — near-black, yellow diamond (World Debit Mastercard)
 *   slate  — deep neutral with a brand rule (the credit cards)
 */
function Face({ tone, name, sub, footnote, scheme }) {
  const palette = {
    brand: { bg: '#FFCC00', bg2: '#F0B400', ink: '#231F20', soft: 'rgba(35,31,32,0.55)' },
    ink: { bg: '#231F20', bg2: '#141112', ink: '#FFFFFF', soft: 'rgba(255,255,255,0.62)' },
    slate: { bg: '#3A3B42', bg2: '#232429', ink: '#FFFFFF', soft: 'rgba(255,255,255,0.62)' },
  }[tone]

  const gradientId = `card-${tone}`

  return (
    <svg
      className="cardart__svg"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${name} card illustration`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.bg} />
          <stop offset="100%" stopColor={palette.bg2} />
        </linearGradient>
      </defs>

      <rect width={W} height={H} rx={R} fill={`url(#${gradientId})`} />

      {/* A single diagonal facet, echoing the fold in the CommBank diamond. */}
      <path
        d={`M${W} 0 L${W} ${H} L${W - 150} ${H} Z`}
        fill={palette.ink}
        opacity="0.06"
      />

      {tone === 'slate' ? <rect x="0" y="0" width={W} height="6" rx="3" fill="#FFCC00" /> : null}

      <Chip x={28} y={64} />
      <Contactless x={82} y={70} colour={palette.ink} />

      <text
        x="28"
        y={H - 58}
        fill={palette.ink}
        fontSize="19"
        fontWeight="800"
        letterSpacing="-0.3"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {name}
      </text>
      <text
        x="28"
        y={H - 36}
        fill={palette.soft}
        fontSize="13"
        fontWeight="500"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {sub}
      </text>

      {footnote ? (
        <text
          x={W - 28}
          y={H - 36}
          textAnchor="end"
          fill={palette.soft}
          fontSize="12"
          fontWeight="600"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {footnote}
        </text>
      ) : null}

      {/* Scheme mark, drawn rather than reproduced. */}
      {scheme === 'visa' ? (
        <text
          x={W - 28}
          y="52"
          textAnchor="end"
          fill={palette.ink}
          fontSize="22"
          fontWeight="800"
          fontStyle="italic"
          letterSpacing="1"
          fontFamily="Inter, system-ui, sans-serif"
          opacity="0.85"
        >
          VISA
        </text>
      ) : (
        <g transform={`translate(${W - 86} 30)`} opacity="0.9">
          <circle cx="22" cy="22" r="20" fill="#EB001B" />
          <circle cx="46" cy="22" r="20" fill="#F79E1B" />
          <path
            d="M34 6.5a20 20 0 0 0 0 31 20 20 0 0 0 0-31Z"
            fill="#FF5F00"
          />
        </g>
      )}
    </svg>
  )
}

const FACES = {
  tmc: { tone: 'brand', name: 'Travel Money Card', sub: '16 currencies, rate locked', footnote: '•••• 4417', scheme: 'visa' },
  wdm: { tone: 'ink', name: 'World Debit Mastercard', sub: '$0 overseas, any ATM', footnote: '•••• 9902', scheme: 'mastercard' },
  credit: { tone: 'slate', name: 'Ultimate Awards', sub: '0% international fee', footnote: '•••• 5531', scheme: 'mastercard' },
}

export default function CardArt({ kind, className = '' }) {
  const face = FACES[kind]
  if (!face) return null

  return (
    <div className={`cardart ${className}`}>
      <Face {...face} />
      {kind === 'tmc' ? (
        <span className="cardart__mark" aria-hidden="true">
          <DiamondMark size={26} />
        </span>
      ) : null}
    </div>
  )
}
