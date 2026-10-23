import './About.css';

/* Only established facts appear here — a Master's degree in
   Spanish, beginner through intermediate, one-to-one lessons.
   Nothing about the person is invented. */
const FACTS = [
  'Master’s degree in Spanish',
  'Beginner to intermediate',
  'One-to-one lessons',
];

function CheckMark() {
  return (
    <svg className="about-fact__mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12.6 L10 17.4 L19 7.2" />
    </svg>
  );
}

function CameraDoodle() {
  return (
    <svg className="about-photo__icon" viewBox="0 0 48 40" aria-hidden="true" focusable="false">
      <path d="M6 12 h8 l3 -5 h14 l3 5 h8 a3 3 0 0 1 3 3 v16 a3 3 0 0 1 -3 3 h-36 a3 3 0 0 1 -3 -3 v-16 a3 3 0 0 1 3 -3 z" />
      <circle cx="24" cy="22" r="7" />
    </svg>
  );
}

function ArrowDoodle() {
  return (
    <svg className="about-more__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 12 h15 M13 6 l6 6 -6 6" />
    </svg>
  );
}

function About() {
  return (
    <section id="about" className="about" aria-labelledby="about-title">
      <div className="about-grid">
        <div className="about-note">
          <p className="about-kicker">The person behind the lessons</p>
          <h2 id="about-title" className="about-title">
            Meet your teacher
          </h2>

          <div className="about-body">
            <p>
              Hello — I’m glad you made it this far down the page.
            </p>
            <p>
              I teach Spanish one-to-one, and I hold a Master’s degree in Spanish.
              Lessons run from complete beginner through to intermediate, so you can
              start with your very first word or pick Spanish back up where you
              left it.
            </p>
            <p>
              Because it’s just the two of us, the lesson moves at your pace. We work
              with real vocabulary — words you’ll actually meet — and there’s always
              room for the question you didn’t want to ask.
            </p>
          </div>

          <a
            className="about-more"
            href="#classes"
            aria-label="See how the lessons work: one-to-one Spanish classes"
          >
            See how the lessons work
            <ArrowDoodle />
          </a>
        </div>

        <div className="about-side">
          {/* The photograph has not been taken yet. This is a
              deliberate, reserved slot — not a broken image:
              there is no <img>, no role="img", and the decorative
              doodle is hidden from assistive technology, so
              nothing is ever announced as a missing picture. The
              box keeps its shape (aspect-ratio) so that dropping
              the real photograph in later moves nothing on the
              page. */}
          <figure className="about-photo">
            <div className="about-photo-frame" aria-hidden="true">
              <CameraDoodle />
              <p className="about-photo-title">Photo to come</p>
              <p className="about-photo-hint">Your teacher, pinned here soon</p>
            </div>
            <figcaption className="about-photo-cap">
              A photograph of your teacher will be pinned here once it is taken.
            </figcaption>
          </figure>

          <ul className="about-facts">
            {FACTS.map((fact) => (
              <li key={fact} className="about-fact">
                <CheckMark />
                <span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default About;
