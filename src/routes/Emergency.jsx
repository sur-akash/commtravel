/* =============================================================================
   /emergency — stranded-proof.

   Everything a traveller might need at the worst moment, on one page, in the
   order they would need it. Written to be useful when someone is stressed and
   on a bad connection: what to press, what happens next, and what it costs.
   ============================================================================= */

import EmergencyPanel from '../components/EmergencyPanel.jsx'
import { Card, Chip, Eyebrow, Icon } from '../components/primitives/index.jsx'
import { useDemo } from '../state/DemoContext.jsx'
import './Emergency.css'

/**
 * What to do, in the order you'd actually need it. This replaced a
 * CommBank-versus-neobank comparison table: a customer standing in a police
 * station in Tokyo does not need to know how a competitor would have handled
 * it. They need to know what to press.
 */
const PLAYBOOK = [
  {
    icon: 'lock',
    when: 'Your card is lost or stolen',
    then: 'Lock it here first — it takes a second and it is reversible, so you can lock it while you go back and check the restaurant. If it really is gone, order a replacement to wherever you are staying.',
    tip: 'Your Travel Money Card came as a pair. Activate the spare before you fly and keep it somewhere separate.',
  },
  {
    icon: 'coins',
    when: 'You have run out of cash',
    then: 'Request emergency cash from your Travel Money Card. It is usually released within 24 to 48 hours and often the same day. Bring photo ID to collect.',
    tip: 'Check the map below first — a machine two streets away may charge no surcharge at all.',
  },
  {
    icon: 'phone',
    when: 'Something has gone badly wrong at 3am',
    then: 'Call +61 2 9999 3283 and reverse the charges through any international operator. Someone answers around the clock, every day of the year.',
    tip: 'Save the number in your phone before you go. It is easier than finding it on a website with no signal.',
  },
  {
    icon: 'shield',
    when: 'You are hurt or need a doctor',
    then: 'Cover-More emergency assistance runs 24/7 on +61 2 8907 5641. They arrange treatment and pay hospitals directly rather than leaving you to claim it back.',
    tip: 'Cover has to be activated before you leave. Check it on the benefits page — it takes two minutes.',
  },
  {
    icon: 'alert',
    when: 'You see a charge you do not recognise',
    then: 'Lock the card, then tell us from the transaction itself. We will dispute it and send a replacement without cancelling anything else you have set up.',
    tip: 'Registering your trip means genuine spending abroad stops looking suspicious in the first place.',
  },
]

/** Things worth doing before you fly, while it is still easy. */
const BEFORE_YOU_GO = [
  'Register your trip so your cards expect the country you are in.',
  'Load your destination currency and lock the rate while you can still choose it.',
  'Activate the travel insurance you are already paying for.',
  'Activate your second Travel Money Card and pack it separately.',
  'Save +61 2 9999 3283 in your phone.',
]

export default function Emergency() {
  const demo = useDemo()

  return (
    <div className="container emergency">
      <header className="emergency__head">
        <Eyebrow>Emergency support</Eyebrow>
        <h1 className="emergency__title">If it all goes wrong</h1>
        <p className="emergency__lede">
          {demo.trip
            ? `You're in ${demo.trip.destination.city}. Everything on this page is one tap away from every other screen while your trip is running.`
            : 'These stay available whether or not a trip is registered. Registering one just means we already know where you are.'}
        </p>
      </header>

      <div className="emergency__grid">
        <div className="emergency__panel">
          <EmergencyPanel />
        </div>

        <aside className="emergency__aside">
          <Card variant="band">
            <h2 className="emergency__aside-title">Before you fly</h2>
            <p className="emergency__aside-body">
              Five minutes now saves an afternoon later. Every one of these is something you can
              only do easily while you are still at home.
            </p>
            <ul className="emergency__checklist">
              {BEFORE_YOU_GO.map((item) => (
                <li key={item}>
                  <Icon name="check" size={16} />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h2 className="emergency__aside-title">If this happens, do this</h2>
            <ul className="emergency__playbook">
              {PLAYBOOK.map((row) => (
                <li className="emergency__play" key={row.when}>
                  <span className="emergency__play-icon">
                    <Icon name={row.icon} size={18} />
                  </span>
                  <div className="emergency__play-body">
                    <p className="emergency__play-when">{row.when}</p>
                    <p className="emergency__play-then">{row.then}</p>
                    <p className="emergency__play-tip">
                      <Icon name="info" size={14} />
                      {row.tip}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  )
}
