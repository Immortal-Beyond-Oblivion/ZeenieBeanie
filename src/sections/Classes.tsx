import './Classes.css';

/* What a lesson is like — described honestly and generically.
   No pricing, no schedule, no curriculum claims beyond what is
   established: one-to-one, beginner through intermediate. */
const LESSONS = [
  {
    title: 'One to one',
    body: 'Just you, just your teacher. No group and no shared attention — whatever you want to ask, you ask it.',
    icon: 'pair',
  },
  {
    title: 'Beginner friendly',
    body: 'Never opened a Spanish textbook? Start with the letters and the first words, and take it from there.',
    icon: 'book',
  },
  {
    title: 'Up to intermediate',
    body: 'Already carrying some Spanish? Pick it up where you are and keep going — the lesson meets you at your level.',
    icon: 'steps',
  },
  {
    title: 'Your pace',
    body: 'We go as fast as you can follow and slow down whenever you need to. Questions and repetition are welcome.',
    icon: 'pace',
  },
];

const SUITS = [
  'Never studied Spanish',
  'Coming back after a break',
  'Already some Spanish',
  'For travel, work or family',
];

function LessonIcon({ kind }: { kind: string }) {
  if (kind === 'pair') {
    return (
      <svg className="classes-card__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 5 h11 a2.5 2.5 0 0 1 2.5 2.5 v4.5 a2.5 2.5 0 0 1 -2.5 2.5 h-4 l-3.5 3.5 v-3.5 h-3.5 a2.5 2.5 0 0 1 -2.5 -2.5 v-4.5 a2.5 2.5 0 0 1 2.5 -2.5 z" />
        <path d="M21 9 h-4.5 v3.5 a2.5 2.5 0 0 0 2.5 2.5 h1 v3 l3.5 -3.5 v-3 a2.5 2.5 0 0 0 -2.5 -2.5 z" />
      </svg>
    );
  }
  if (kind === 'book') {
    return (
      <svg className="classes-card__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 6.5 c-2 -2 -5 -2.5 -9 -2.5 v13 c4 0 7 0.5 9 2.5 c2 -2 5 -2.5 9 -2.5 v-13 c-4 0 -7 0.5 -9 2.5 z" />
        <path d="M12 6.5 v13" />
      </svg>
    );
  }
  if (kind === 'steps') {
    return (
      <svg className="classes-card__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 20 h4.5 v-5 h4.5 v-5 h4.5 v-5 H21" />
        <path d="M3 20 h18" />
      </svg>
    );
  }
  return (
    <svg className="classes-card__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7 v5.4 l3.6 2.1" />
    </svg>
  );
}

function ArrowDoodle() {
  return (
    <svg className="classes-cta__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 12 h15 M13 6 l6 6 -6 6" />
    </svg>
  );
}

function Classes() {
  return (
    <section id="classes" className="classes" aria-labelledby="classes-title">
      <header className="classes-head">
        <p className="classes-kicker">One-to-one Spanish, your way</p>
        <h2 id="classes-title" className="classes-title">
          The lessons
        </h2>
      </header>

      <ul className="classes-grid">
        {LESSONS.map((lesson) => (
          <li key={lesson.title} className="classes-card">
            <span className="classes-card__sticker">
              <LessonIcon kind={lesson.icon} />
            </span>
            <h3 className="classes-card__title">{lesson.title}</h3>
            <p className="classes-card__body">{lesson.body}</p>
          </li>
        ))}
      </ul>

      <div className="classes-suits">
        <p className="classes-suits__label">Who it suits</p>
        <ul className="classes-suits__list">
          {SUITS.map((suit) => (
            <li key={suit} className="classes-suits__chip">
              {suit}
            </li>
          ))}
        </ul>
      </div>

      <div className="classes-cta">
        <a
          className="classes-cta__link"
          href="#contact"
          aria-label="Book a trial class: one-to-one Spanish lessons"
        >
          Book a trial class
          <ArrowDoodle />
        </a>
        <p className="classes-cta__note">
          Tap for my contact details, then send a message whenever you’re ready.
        </p>
      </div>
    </section>
  );
}

export default Classes;
