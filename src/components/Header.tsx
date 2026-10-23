import './Header.css';

/*
 * The hero is the site's front door: a taped case file on the cream
 * desk, with the cat detective leaning on it. It says what the
 * visitor will actually do here (solve a case, learn a Spanish word)
 * and points at the classes section.
 *
 * Accessibility notes:
 *   - the h1 is the page's only h1 (the game's own title is an h2);
 *   - the mascot carries a descriptive alt because it names the
 *     game's character and identity, which the headline only
 *     implies;
 *   - the focus ring is global (src/index.css) and is not repeated
 *     here.
 */
function Header() {
    return (
        <header className="hero-section">
            <div className="hero-card">
                <span className="hero-tape hero-tape-top" aria-hidden="true"></span>
                <span className="hero-tape hero-tape-bottom" aria-hidden="true"></span>

                {/* Left side: the pitch */}
                <div className="hero-copy">
                    <p className="hero-kicker">Word Detective</p>

                    <h1 className="main-title">Learn Spanish by playing</h1>

                    <p className="hero-subtitle">
                        Every case holds one Spanish word. Work out its
                        meaning, and the case gets stamped in your casebook.
                    </p>

                    <p className="hero-tagline">
                        One-on-one Spanish lessons from a teacher with a
                        Master's degree in Spanish, from your very first
                        words through intermediate.
                    </p>

                    <ul className="hero-facts">
                        <li className="hero-fact">27 letters to unlock</li>
                        <li className="hero-fact">One word per case</li>
                        <li className="hero-fact">A casebook that fills up</li>
                    </ul>

                    <a
                        className="hero-cta"
                        href="#classes"
                        aria-label="See the classes: one-to-one Spanish lessons"
                    >
                        See the classes
                        <svg
                            className="hero-cta-arrow"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            focusable="false"
                        >
                            <path
                                d="M4 12h14M13 6l6 6-6 6"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </a>
                </div>

                {/* The mascot is out of the hero for now, pending a
                    replacement. The copy carries the card on its own. */}
            </div>
        </header>
    );
}

export default Header;
