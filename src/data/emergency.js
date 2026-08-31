/* =============================================================================
   Stranded-proof panel.

   This is the capability gap that no neobank can close: CommBank has branches,
   a card network, a 24/7 human line and a cash-delivery arrangement. A chat
   window does not replace any of that at 2am in a city you can't read.

   Every promise below is CommBank's own published wording, not marketing
   invented for the demo. Where the published page is vague, this file says so
   rather than inventing a timeframe.
   ============================================================================= */

/** The headline stat that leads the panel. */
export const EMERGENCY_PROMISE = {
  stat: '24–48 hours',
  qualifier: 'often the same day',
  claim: 'Emergency cash, anywhere in the world',
  source: 'commbank.com.au/support/overseas',
}

export const EMERGENCY_ACTIONS = [
  {
    id: 'lock',
    icon: 'lock',
    label: 'Lock card',
    description: 'Freezes the card immediately. Nothing new goes through and nothing is cancelled.',
    tone: 'danger',
    instant: true,
    confirmation: {
      title: 'Card locked',
      body: 'Nothing can be charged to it. Your backup card ending 4425 still works. Unlock any time.',
    },
  },
  {
    id: 'cash',
    icon: 'coins',
    label: 'Request emergency cash',
    description:
      'Funds from your Travel Money Card, released within 24–48 hours and often the same day.',
    tone: 'primary',
    confirmation: {
      title: 'Emergency cash requested',
      body: 'We will call you on the number in your profile to confirm collection. Bring photo ID.',
    },
  },
  {
    id: 'replacement',
    icon: 'card',
    label: 'Request a replacement card',
    description:
      'Sent to you and any additional cardholder, wherever you are in the world. $20 delivery.',
    tone: 'secondary',
    confirmation: {
      title: 'Replacement card on its way',
      body: 'Delivering to your registered hotel in Shibuya. $20 has been charged. Track it in the app.',
    },
  },
  {
    id: 'call',
    icon: 'phone',
    label: 'Call CommBank, reverse charges',
    description:
      'Ask any international operator for +61 2 9999 3283 and reverse the charges. A person answers, 24/7.',
    tone: 'secondary',
    href: 'tel:+61299993283',
  },
  {
    id: 'branch',
    icon: 'pin',
    label: 'Find the nearest partner',
    description: 'Partner banks and cash points near you, with opening hours in local time.',
    tone: 'secondary',
  },
]
