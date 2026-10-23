import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import './Casebook.css';
import { LETTERS, letterOfId, loadEntriesByIds } from './lexicon';
import type { VocabEntry } from './lexicon';
import type { Dossier } from './mysteries';
import type { StampState } from './WordDetective';

/* ============================================================
   Word Detective — Casebook (Slice 004b, phase b2, spec §10)

   The bound notebook on the desk: the visible truth of the
   case records (§4). Two views — the mystery evidence board
   (default: the quest forward) and letter pages (letters are
   discovery/navigation regions, never objectives — R12).

   Locked behaviors this component carries:
   - stamps are physical slots/rows — never a bar, ring, meter,
     percentage, or numeral [R7]; state is named in text as
     well as shape [§14]
   - red herrings expose a REOPEN entry: a fresh deduction on
     the fixed word with reshuffled slips [R6] (the fresh
     attempt itself is WordDetective's reopenCase)
   - clue beats pin as taped paper after their solved
     thresholds — reward as object, not number [R7]
   - no player-facing filters/difficulty controls anywhere
     [R13]; no letter-completion quotas or percentages [R12]
   - ≥44px targets, dashed focus, polite announcements via
     the section live region [§14]
   - ≤600px: collapses to a compact stamps strip + disclosure
     (§15), reset control joins the expanded casebook in b3
   ============================================================ */

interface CasebookProps {
  records: Record<string, StampState>;
  dossier: Dossier;
  /** All 8 pinned cases solved-or-converted (file affordance shows). */
  isClosed: boolean;
  /** Open the CASE CLOSED file (dialog lives on the desk, §14). */
  onOpenFile: () => void;
  /** WordDetective focuses this on dialog close [§14]. */
  fileBtnRef: RevealFileBtnRef;
  /** Fixed-word reopen entry → WordDetective.reopenCase [R6]. */
  onReopen: (id: string) => void;
  /** Confirmed reset → WordDetective.resetCasebook [R2/§7.3:
   *  the destructive confirmation lives here, R16]. */
  onReset: () => void;
  /** The casebook's own loader failed → the section's ONE live
   *  region says so (the page shows it too, §7.2). */
  onLoadFailure?: (message: string) => void;
}

export type RevealFileBtnRef = RefObject<HTMLButtonElement | null>;

/** What the casebook says when its own loader failed — the
 *  same words go to the page and to the ONE live region. The first
 *  failure is a retry; a second one asks for a reload, because a
 *  module the browser failed to fetch stays broken for the rest of
 *  the page's life. */
function loadErrorMessage(streak: number): string {
  if (streak > 1) {
    return (
      'The case files still will not load — reload the desk to fetch ' +
      'them afresh. Your stamps are safe.'
    );
  }
  return (
    'The words could not be read from the case files — the stamps are ' +
    'still recorded. Try again from the casebook.'
  );
}

/** What the board shows while the word is still on its way — a
 *  neutral mark. It is NEVER a raw id slug: a slug is not a
 *  Spanish word ("name", "espanol"), and showing one as if it
 *  were would put misspelled Spanish in front of a learner. */
const PENDING_WORD = '···';

/** Visible + screen-reader text for a record state [§14:
 *  state is never conveyed by color/shape alone]. */
function stateLabel(state: StampState): string {
  if (state === 'solved') return 'solved';
  if (state === 'converted') return 'converted — was a red herring';
  return 'red herring — open case';
}

/** The stamp marks themselves (aria-hidden visuals; the row or
 *  slot carries the words). Solved = ink check in a gold disc,
 *  red herring = red fish sticker, converted = fish + check. */
function StampVisual({ state }: { state: StampState }) {
  if (state === 'solved') {
    return (
      <span className="wd-stamp wd-stamp-solved" aria-hidden="true">
        <span className="wd-stamp-visual">{'✓'}</span>
      </span>
    );
  }
  return (
    <span
      className={`wd-stamp ${state === 'converted' ? 'wd-stamp-converted' : 'wd-stamp-red-herring'}`}
      aria-hidden="true"
    >
      <span className="wd-stamp-visual">
        <svg className="wd-fish" viewBox="0 0 44 26" focusable="false">
          <path d="M6 13 C 12 4, 28 4, 34 13 C 28 22, 12 22, 6 13 Z" />
          <path d="M34 13 L42 6 L40.5 13 L42 20 Z" />
          <circle cx="13" cy="11" r="1.5" />
          {state === 'converted' && (
            <path className="wd-fish-check" d="M18 13 l3.5 3.5 7.5 -8" />
          )}
        </svg>
      </span>
    </span>
  );
}

function Casebook({
  records,
  dossier,
  isClosed,
  onOpenFile,
  fileBtnRef,
  onReopen,
  onReset,
  onLoadFailure,
}: CasebookProps) {
  const [view, setView] = useState<'mystery' | 'letters'>('mystery');
  const [pageLetter, setPageLetter] = useState<string | null>(null);
  const [entryMap, setEntryMap] = useState<Record<string, VocabEntry>>({});
  // §15: at ≤600px the notebook collapses to a stamps strip with
  // a disclosure; expanded=false is restored when leaving mobile.
  const [isCompact, setIsCompact] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const disclosureRef = useRef<HTMLButtonElement | null>(null);
  // Reset confirmation (§14/R16 locked: visible label, a real
  // confirmation step, keyboard operable, announced upstream)
  const [confirming, setConfirming] = useState(false);
  const resetBtnRef = useRef<HTMLButtonElement | null>(null);
  const wasConfirmingRef = useRef(false);
  // The loader can fail (§7.2). The failure is VISIBLE and
  // RECOVERABLE: a taped note says what happened, and a retry
  // re-runs the same load. Never a timer, never a silent id-slug
  // forever.
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  // A module the browser failed to fetch stays broken for the rest
  // of the page's life, so the second failure offers a reload
  // instead of a retry that cannot work.
  const [failureStreak, setFailureStreak] = useState(0);

  // Resolve words/glosses for every record through the lazy
  // per-letter loader (cached after first draw — R3).
  //
  // The dossier's PINNED cases are resolved too, not just the
  // stamped ones: the mystery board lists every pinned case from
  // the first paint, so their words have to be on hand before a
  // word is shown. Without this the board would fall back to the
  // raw id slug — "name", "espanol" — and a learner would read
  // misspelled Spanish (see wordFor below).
  const wantedIds = useMemo(() => {
    const ids = new Set<string>(dossier.caseIds);
    for (const id of Object.keys(records)) ids.add(id);
    return [...ids];
  }, [dossier.caseIds, records]);

  useEffect(() => {
    let cancelled = false;
    if (wantedIds.length === 0) {
      setEntryMap({});
      setFailureStreak(0);
      setLoadFailed(false);
      return;
    }
    loadEntriesByIds(wantedIds)
      .then((entries) => {
        if (cancelled) return;
        const map: Record<string, VocabEntry> = {};
        for (const entry of entries) map[entry.id] = entry;
        setEntryMap(map);
        setFailureStreak(0);
        setLoadFailed(false);
      })
      .catch(() => {
        // Loader failure degrades to unresolved words (§7.2) — the
        // casebook still communicates state, and the words show a
        // neutral mark instead of a slug — but it is never SILENT:
        // the note below explains and offers a way back.
        if (cancelled) return;
        setFailureStreak((streak) => streak + 1);
        setLoadFailed(true);
        onLoadFailure?.(loadErrorMessage(failureStreak + 1));
      });
    return () => {
      cancelled = true;
    };
  }, [wantedIds, retryToken, onLoadFailure]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)');
    const update = () => {
      setIsCompact(media.matches);
      if (!media.matches) setExpanded(false);
    };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  // Focus lands on the safe option when the confirmation opens, and
  // returns to the reset control when it closes (confirm OR cancel) —
  // focus never drops to <body> (§14).
  const noBtnRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (confirming) {
      noBtnRef.current?.focus();
    } else if (wasConfirmingRef.current) {
      resetBtnRef.current?.focus();
    }
    wasConfirmingRef.current = confirming;
  }, [confirming]);

  const recordIds = Object.keys(records);
  const stampedLetters = LETTERS.filter((letter) =>
    recordIds.some((id) => letterOfId(id) === letter),
  );
  const herrings = recordIds.filter((id) => records[id] === 'red-herring');
  const pinnedSolvedCount = dossier.caseIds.filter(
    (id) => records[id] === 'solved' || records[id] === 'converted',
  ).length;
  const revealedBeats = dossier.beats.filter(
    (beat) => pinnedSolvedCount >= beat.threshold,
  );

  const currentPage =
    pageLetter !== null && stampedLetters.includes(pageLetter)
      ? pageLetter
      : (stampedLetters[0] ?? null);
  const pageRows = recordIds.filter((id) => letterOfId(id) === currentPage);

  const entryFor = (id: string) => entryMap[id];
  /**
   * The word for a record id — undefined until the lexicon has
   * answered. A slug is NEVER returned in its place: the id slug
   * is a key, not a word, and a dossier that uses "ñ-name" or
   * "e-espanol" would otherwise show "name"/"espanol" on the
   * board for a moment — misspelled Spanish, in front of a
   * learner. Callers show a neutral mark until the real word
   * arrives (PENDING_WORD).
   */
  const wordFor = (id: string): string | undefined => entryMap[id]?.word;
  /** The same word, spoken: for screen readers and labels. */
  const spokenWord = (id: string): string =>
    entryMap[id]?.word ?? 'word not read yet';

  const toggleDisclosure = () => {
    // The disclosure button persists in both states, so focus is
    // simply kept on it — no timer, no rAF (004a no-timer rule).
    if (expanded) disclosureRef.current?.focus();
    setExpanded((wasOpen) => !wasOpen);
  };

  const collapsed = isCompact && !expanded;

  return (
    <aside className="wd-casebook" aria-label="Casebook">
      <div className="cb-head">
        <h3 className="cb-title">Casebook</h3>
        {isCompact && (
          <button
            type="button"
            className="cb-disclosure"
            aria-expanded={expanded}
            aria-controls="cb-body"
            ref={disclosureRef}
            onClick={toggleDisclosure}
          >
            {expanded ? 'Close casebook' : 'Open casebook'}
          </button>
        )}
      </div>

      <div className="cb-body" id="cb-body">
        {loadFailed && (
          /* The loader failed: a taped note, in words, with a way
             back. The stamps below are still true (§7.2). */
          <p className="cb-load-error">
            <span className="cb-load-error-text">
              {loadErrorMessage(failureStreak)}
            </span>
            {failureStreak > 1 ? (
              <button
                type="button"
                className="cb-load-retry"
                onClick={() => window.location.reload()}
              >
                Reload the desk
              </button>
            ) : (
              <button
                type="button"
                className="cb-load-retry"
                onClick={() => setRetryToken((token) => token + 1)}
              >
                Try again
              </button>
            )}
          </p>
        )}
        {collapsed ? (
          /* §15 compact strip (≤600px): stamps only, disclosure above */
          <div className="cb-compact">
            <div className="cb-compact-stamps">
              {recordIds.length === 0 ? (
                <span className="wd-stamps-empty">stamps land here</span>
              ) : (
                recordIds.map((id, index) => (
                  <span
                    key={id}
                    className={`wd-tilt-${(index % 3) + 1}`}
                    title={spokenWord(id)}
                  >
                    <StampVisual state={records[id]} />
                  </span>
                ))
              )}
            </div>
            <span className="sr-only">
              {recordIds.length === 0
                ? 'no stamps yet'
                : recordIds
                    .map((id) => `${spokenWord(id)}: ${stateLabel(records[id])}`)
                    .join('; ')}
            </span>
          </div>
        ) : (
          <>
            <div className="cb-views" role="group" aria-label="Casebook view">
              <button
                type="button"
                className={`cb-view${view === 'mystery' ? ' is-current' : ''}`}
                aria-pressed={view === 'mystery'}
                onClick={() => setView('mystery')}
              >
                Mystery
              </button>
              <button
                type="button"
                className={`cb-view${view === 'letters' ? ' is-current' : ''}`}
                aria-pressed={view === 'letters'}
                onClick={() => setView('letters')}
              >
                Letters
              </button>
            </div>

            {view === 'mystery' ? (
              <div className="cb-mystery">
                <p className="cb-opening">“{dossier.opening}”</p>

                {/* legend: state names in words, not just shape [§14] */}
                <p className="cb-legend">
                  <span className="cb-legend-item">
                    <span className="wd-stamp wd-stamp-solved wd-stamp-mini" aria-hidden="true">
                      <span className="wd-stamp-visual">{'✓'}</span>
                    </span>
                    solved
                  </span>
                  <span className="cb-legend-item">
                    <span className="wd-stamp wd-stamp-red-herring wd-stamp-mini" aria-hidden="true">
                      <span className="wd-stamp-visual">
                        <svg className="wd-fish" viewBox="0 0 44 26" focusable="false">
                          <path d="M6 13 C 12 4, 28 4, 34 13 C 28 22, 12 22, 6 13 Z" />
                          <path d="M34 13 L42 6 L40.5 13 L42 20 Z" />
                          <circle cx="13" cy="11" r="1.5" />
                        </svg>
                      </span>
                    </span>
                    red herring
                  </span>
                  <span className="cb-legend-item">
                    <span className="wd-stamp wd-stamp-converted wd-stamp-mini" aria-hidden="true">
                      <span className="wd-stamp-visual">
                        <svg className="wd-fish" viewBox="0 0 44 26" focusable="false">
                          <path d="M6 13 C 12 4, 28 4, 34 13 C 28 22, 12 22, 6 13 Z" />
                          <path d="M34 13 L42 6 L40.5 13 L42 20 Z" />
                          <circle cx="13" cy="11" r="1.5" />
                          <path className="wd-fish-check" d="M18 13 l3.5 3.5 7.5 -8" />
                        </svg>
                      </span>
                    </span>
                    converted
                  </span>
                </p>

                <h4 className="cb-sub">{dossier.titleEN}</h4>
                <ul className="cb-slots">
                  {dossier.caseIds.map((id) => {
                    const state = records[id];
                    const word = wordFor(id);
                    return (
                      <li
                        key={id}
                        className={`cb-slot${state ? ' is-stamped' : ''}`}
                      >
                        <span
                          className={`cb-slot-word${word ? '' : ' is-pending'}`}
                        >
                          {word ?? PENDING_WORD}
                        </span>
                        {state && <StampVisual state={state} />}
                        <span className="sr-only">
                          {spokenWord(id)}:{' '}
                          {state ? stateLabel(state) : 'not stamped yet'}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* clue beats pin as taped paper — reward as object [R7] */}
                {revealedBeats.map((beat) => (
                  <div className="cb-clue" key={beat.threshold}>
                    <span className="cb-clue-tape" aria-hidden="true" />
                    <svg
                      className="cb-clue-art"
                      viewBox="0 0 40 34"
                      aria-hidden="true"
                      focusable="false"
                    >
                      {beat.art === 'footprints' ? (
                        <>
                          <ellipse cx="10" cy="22" rx="5" ry="7" transform="rotate(-15 10 22)" />
                          <circle cx="5" cy="12" r="1.6" />
                          <circle cx="9" cy="10" r="1.6" />
                          <circle cx="13" cy="11" r="1.6" />
                          <ellipse cx="28" cy="14" rx="5" ry="7" transform="rotate(12 28 14)" />
                          <circle cx="24" cy="5" r="1.6" />
                          <circle cx="28" cy="3.5" r="1.6" />
                          <circle cx="32" cy="4.5" r="1.6" />
                        </>
                      ) : (
                        <>
                          <circle cx="6" cy="26" r="2" />
                          <circle cx="14" cy="22" r="2" />
                          <circle cx="22" cy="24" r="2" />
                          <circle cx="29" cy="18" r="2" />
                          <circle cx="34" cy="11" r="2" />
                          <path d="M36 6 q3 -3 2 -5" />
                        </>
                      )}
                    </svg>
                    <p className="cb-clue-text">
                      <span className="cb-clue-label">clue note</span> {beat.note}
                    </p>
                  </div>
                ))}

                {isClosed && (
                  <button
                    type="button"
                    className="cb-file"
                    ref={fileBtnRef}
                    onClick={onOpenFile}
                  >
                    <span className="cb-file-stamp" aria-hidden="true">
                      CASE CLOSED
                    </span>
                    <span className="sr-only">Open the closed case file</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="cb-letters">
                {stampedLetters.length === 0 ? (
                  <p className="cb-empty">
                    No stamps yet — the casebook fills as cases are recorded.
                  </p>
                ) : (
                  <>
                    <div
                      className="cb-letter-chips"
                      role="group"
                      aria-label="Letter pages"
                    >
                      {stampedLetters.map((letter) => (
                        <button
                          key={letter}
                          type="button"
                          className={`cb-chip${letter === currentPage ? ' is-current' : ''}`}
                          aria-pressed={letter === currentPage}
                          onClick={() => setPageLetter(letter)}
                        >
                          {letter}
                        </button>
                      ))}
                    </div>
                    <h4 className="cb-sub">Letter {currentPage} page</h4>
                    <ul className="cb-rows">
                      {pageRows.map((id) => {
                        const state = records[id];
                        const entry = entryFor(id);
                        const word = wordFor(id);
                        return (
                          <li className="cb-row" key={id}>
                            <StampVisual state={state} />
                            <span className="cb-row-main">
                              <span
                                className={`cb-row-word${word ? '' : ' is-pending'}`}
                              >
                                {word ?? PENDING_WORD}
                              </span>
                              {entry?.gloss && (
                                <span className="cb-row-gloss">{entry.gloss}</span>
                              )}
                            </span>
                            <span className="cb-state-tag">{stateLabel(state)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* Red herrings — first-class reopen entry [R6/§6] */}
            {herrings.length > 0 && (
              <section className="cb-herrings" aria-label="Red herrings">
                <h4 className="cb-sub">Red herrings</h4>
                <ul>
                  {herrings.map((id) => {
                    const word = wordFor(id);
                    return (
                      <li className="cb-herring" key={id}>
                        <StampVisual state="red-herring" />
                        <span
                          className={`cb-herring-word${word ? '' : ' is-pending'}`}
                        >
                          {word ?? PENDING_WORD}
                        </span>
                        <span className="sr-only">
                          red herring — open case: {spokenWord(id)}
                          {entryFor(id) ? `, means ${entryFor(id)?.gloss}` : ''}
                        </span>
                        <button
                          type="button"
                          className="cb-reopen"
                          aria-label={`Reopen case: ${word ?? 'this case'}`}
                          onClick={() => onReopen(id)}
                        >
                          Reopen
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* Reset (R2/§16 R16): visible label + confirmation —
                destructive actions never wipe on first press */}
            <div className="cb-foot">
              {confirming ? (
                <div className="cb-confirm" role="group" aria-label="Confirm reset">
                  <span className="cb-confirm-text">Erase every stamp?</span>
                  <button
                    type="button"
                    className="cb-reset cb-reset-yes"
                    onClick={() => {
                      setConfirming(false);
                      onReset();
                    }}
                  >
                    Yes, reset
                  </button>
                  <button
                    type="button"
                    className="cb-reset cb-reset-no"
                    ref={noBtnRef}
                    onClick={() => setConfirming(false)}
                  >
                    Keep stamps
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="cb-reset"
                  ref={resetBtnRef}
                  onClick={() => setConfirming(true)}
                >
                  Reset casebook
                </button>
              )}
              <svg className="wd-cat" viewBox="0 0 56 52" focusable="false" aria-hidden="true">
                <path d="M10 20 L7 6 L20 13" />
                <path d="M46 20 L49 6 L36 13" />
                <path d="M8 24 q0 -14 20 -14 q20 0 20 14 q0 16 -20 16 q-20 0 -20 -16" />
                <path d="M20 24 l0 2" />
                <path d="M36 24 l0 2" />
                <path d="M28 29 l0 3" />
                <path d="M28 32 q-4 4 -8 1" />
                <path d="M28 32 q4 4 8 1" />
                <path d="M6 28 l-5 -2" />
                <path d="M6 32 l-5 1" />
                <path d="M50 28 l5 -2" />
                <path d="M50 32 l5 1" />
              </svg>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

export default Casebook;
