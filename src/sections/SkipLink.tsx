import { useEffect, type MouseEvent } from 'react';
import './SkipLink.css';

/* The skip link is a real anchor: it points at the game's own
   heading, so it works with the keyboard, with a screen reader's
   link list, and (if this script never ran) with the browser's
   native fragment handling.

   The heading is given tabindex="-1" at runtime — it is the
   game's markup, not ours to edit, and a heading is not focusable
   by default. Without it, following the link would move the
   viewport but leave the keyboard user parked at the top of the
   page. */
const TARGET_ID = 'game-title';

function makeFocusable(target: HTMLElement) {
  if (!target.hasAttribute('tabindex')) {
    target.setAttribute('tabindex', '-1');
  }
}

export default function SkipLink() {
  useEffect(() => {
    const target = document.getElementById(TARGET_ID);
    if (target) makeFocusable(target);
  }, []);

  function handleActivate(event: MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById(TARGET_ID);
    if (!target) return; // no target: let the browser follow the hash

    event.preventDefault();
    makeFocusable(target);
    target.focus({ preventScroll: true });
    // scrollIntoView respects the target's scroll-margin-top, so
    // the heading lands with the same breathing room as every
    // other in-page link.
    target.scrollIntoView({ block: 'start' });
    window.history.replaceState(null, '', `#${TARGET_ID}`);
  }

  return (
    <a className="skip-link" href={`#${TARGET_ID}`} onClick={handleActivate}>
      Skip to the game
    </a>
  );
}
