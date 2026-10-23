import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import './WordDetective.css';
import Casebook from './Casebook';
import type { RevealFileBtnRef } from './Casebook';
import {
  LETTERS,
  letterOfId,
  loadAllCases,
  loadEntriesByIds,
  loadGlossPool,
  loadLetter,
} from './lexicon';
import type { VocabEntry } from './lexicon';
import { DOSSIERS } from './mysteries';
import type { Dossier } from './mysteries';

/* ============================================================
   Word Detective — Slices 004a + 004b (phases b1 + b2)
   004a "The Detective's Desk": one bounded desk scene, immediate
   verdict + same-flow learning, no timed transitions, no audio.
   004b b1 (state + functional stamps + keyboard):
   1  letter keys ARM the next case (click or physical key) and
      never draw — the taped deck stays the primary draw [R1]
   2  stamp states are real records: solved / red-herring /
      converted, never rendered as numerals/XP/bars [§4, R6/R7]
   3  dataset reached ONLY via the lexicon loader contract —
      lazy + cached, out of the initial bundle [R3/R5]
   4  27 keycaps (a–z + ñ), no Ch/Ll, accents/ü are learning
      notes, not keys [R14]
   5  no timers/scores/progress bars/filters anywhere [R6/R7/R13]
   6  the deck IS the primary semantic "Draw a case" button
   004b b2 (casebook + dossier + CASE CLOSED):
   7  the Casebook is the §4 visible truth: mystery board,
      letter pages, clue beats as taped paper [R7]
   8  red herrings expose REOPEN — fixed word, fresh reshuffled
      deduction, conversion announced [R6/§14]
   9  CASE CLOSED fires once as a bounded, focus-managed
      discovery dialog — no totals, no checklist energy [R8]
   Physical-letter handling is scoped to this section's focus
   only; Tab/Enter/Space/arrows are never intercepted (§14).
   ============================================================ */

/* ------------------------------------------------------------
   Desk fixes (w2c):
   10 a wrong answer NEVER says "case closed" — a red herring is
      an OPEN case, and the voice comes from the VERDICT, never
      from the record (verdictCopy below)
   11 a conversion says so in WORDS — state is never signalled by
      colour alone (§14)
   12 'drawing' is a VISIBLE state (paper + ink, no spinner), and
      a failed load is visible AND recoverable on the desk and in
      the casebook (§7.2)
   13 letter keys never arm a case while the CASE CLOSED dialog is
      open — the dialog is a DOM descendant of this section

   Desk fixes (w3a):
   14 the dossiers are a LINEAR PROGRESSION: the desk walks the
      authored list forward, one file at a time — never a picker,
      never a filter, never an "X of N" readout (R13)
   15 the CASE CLOSED quiet line is a REAL link to the contact
      section — the payoff has to lead somewhere (§12)
   16 a red herring can be re-opened FROM the learning panel: a
      fresh deduction, reshuffled slips, never a one-click convert
      (R6)
   ------------------------------------------------------------ */

type Phase = 'idle' | 'drawing' | 'inspect' | 'learn';
// 'drawing' is entered only by a user action and left by the
// loader promise resolving (or failing) — never by a timer
// (004a §17-1). The CSS pull animation covers the motion.

type StampState = 'solved' | 'red-herring' | 'converted';

/**
 * What the visitor's last guess actually DID — the learning panel
 * speaks from this, never from the record alone: a wrong guess on
 * an already-closed case keeps its 'solved' record, but it must
 * still read as an open case, not as a fresh closure.
 */
type Verdict = 'solved' | 'converted' | 'wrong';

/** The last guess, with the one thing the record cannot say: was
 *  this case ALREADY closed when the guess was made? */
interface VerdictState {
  kind: Verdict;
  closedBefore: boolean;
}

/**
 * A recoverable load failure: the message plus the action that
 * retries it. Never a timer, never a dead end (§7.2).
 */
interface LoadFailure {
  message: string;
  retry: { kind: 'draw' } | { kind: 'reopen'; id: string } | { kind: 'reload' };
}

/**
 * The desk's way back from a failed load.
 *
 * The FIRST failure is a plain retry: the loader re-runs (it clears
 * its own failed promises, §7.2). If that fails too, the desk asks
 * for a reload instead: a module the browser failed to fetch is
 * remembered as broken for the rest of the page's life, so only a
 * fresh page can fetch it again. The stamps are safe either way —
 * they live in localStorage (§7.3).
 */
function loadFailureFor(
  retry: LoadFailure['retry'],
  streak: number,
): LoadFailure {
  if (streak > 1) {
    return {
      message:
        'The case files still will not load \u2014 reload the desk to fetch ' +
        'them afresh. Your stamps are safe.',
      retry: { kind: 'reload' },
    };
  }
  return {
    message:
      retry.kind === 'reopen'
        ? 'That case file could not be reopened \u2014 try again.'
        : 'The case files could not be loaded \u2014 try drawing again.',
    retry,
  };
}

interface Case {
  letter: string;
  entry: VocabEntry;
}

interface Slip {
  id: number;
  text: string;
  isCorrect: boolean;
}

/**
 * The play order — however many dossiers are authored, in order.
 * Nothing here hard-codes "exactly one": the desk walks the list
 * FORWARD, one file at a time [R4; spec §11].
 *
 * A file is CLOSED when every one of its pinned cases is solved or
 * converted — the record is the only source of truth (§4).
 */
function isDossierClosed(
  dossier: Dossier,
  records: Record<string, StampState>,
): boolean {
  return (
    dossier.caseIds.length > 0 &&
    dossier.caseIds.every(
      (id) => records[id] === 'solved' || records[id] === 'converted',
    )
  );
}

/**
 * Where a visitor RESUMES: the first file that is not closed yet.
 * Derived from the stored stamps, so a returning visitor lands on
 * the file they were working. A finished file is never re-opened —
 * its stamps stay in the casebook either way (§7.3).
 */
function firstOpenFile(records: Record<string, StampState>): number {
  const index = DOSSIERS.findIndex(
    (dossier) => !isDossierClosed(dossier, records),
  );
  return index === -1 ? DOSSIERS.length - 1 : index;
}

/**
 * The dialog's own focusables — the focus trap cycles these. It is
 * a LIST now, not a single control: the quiet line's link and the
 * next-file button are part of the circle.
 */
function focusableIn(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
  );
}

/**
 * Persistence (b3, spec §7.3 [Locked — R2]): ONE versioned key
 * holding ids + states only — no words, no glosses, no streaks,
 * no timestamps, no PII, no backend/cookies. Empty records remove
 * the key entirely. Every access is try/caught so unavailable or
 * hardened storage degrades to a working session-only casebook.
 */
const STORAGE_KEY = 'wd-casebook-v1';

function loadRecords(): Record<string, StampState> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    const records: Record<string, StampState> = {};
    for (const [id, state] of Object.entries(parsed as Record<string, unknown>)) {
      if (
        state === 'solved' || state === 'red-herring' || state === 'converted'
      ) {
        records[id] = state;
      }
    }
    return records;
  } catch {
    return {}; // corrupt/unavailable storage → session-only (§7.3)
  }
}

function saveRecords(records: Record<string, StampState>): void {
  try {
    if (Object.keys(records).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
  } catch {
    /* quota/private mode → session-only casebook, game unaffected (§7.3) */
  }
}

/** Fisher–Yates over a copy — approved no-repeat cycle rule. */
function shuffle<T>(items: T[]): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The three slips for a drawn case: the correct gloss plus two
 * DISTINCT glosses sampled from the real dataset, shuffled so the
 * answer is never systematically first. Frozen at draw time.
 */
function buildSlips(correctGloss: string, glossPool: string[]): Slip[] {
  const others = glossPool.filter((gloss) => gloss !== correctGloss);
  const distractors = shuffle(others).slice(0, 2);
  return shuffle([correctGloss, ...distractors]).map((text, index) => ({
    id: index,
    text,
    isCorrect: text === correctGloss,
  }));
}

/** Strip edge punctuation and accents for tolerant token matching. */
function normalizeToken(token: string): string {
  return token
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Render the example sentence, highlighting the case word with a
 * marker stroke — only once the case is closed (learning state).
 * Match order: exact token (accent-insensitive) → word with an
 * inflection suffix (e.g. "tarde" in "Buenas tardes.").
 */
function renderSentence(sentence: string, word: string, highlight: boolean) {
  if (!highlight) return sentence;
  const target = normalizeToken(word);
  const tokens = sentence.split(/(\s+)/);
  let matched = false;
  return tokens.map((token, index) => {
    if (!matched) {
      const core = token.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
      const normalized = core ? normalizeToken(core) : '';
      if (normalized === target || normalized.startsWith(target)) {
        matched = true;
        return (
          <mark className="wd-mark" key={index}>
            {token}
          </mark>
        );
      }
    }
    return token;
  });
}

/** §8/§9 orthography micro-note — a teaching moment, never a key (R14). */
function orthoNote(entry: VocabEntry): string | null {
  const flags = entry.orthography;
  if (!flags) return null;
  if (flags.diaeresis) {
    return 'Two dots over the u — a diéresis — tell you to say the u out loud: pingüino.';
  }
  if (flags.enye) {
    return 'The ñ is a letter of its own — 27 letters, a to z plus ñ.';
  }
  if (flags.accented) {
    return 'The tilt over the vowel is an accent (a tilde) — same letter, new stress.';
  }
  return null;
}

/**
 * The three verdict voices — ONE source of truth, so no branch can
 * fall back to a "case closed" line it does not mean.
 *
 * - solved     → the case is genuinely closed.
 * - converted  → a red herring the visitor came back to and cracked;
 *                it says so in WORDS, because state is never
 *                signalled by colour alone (§14).
 * - wrong      → a red herring: an OPEN case. No penalty, no
 *                shaming language — "not counted yet" is the only
 *                cost (R6). Never "case closed", never "clue
 *                upgraded".
 */
function verdictCopy(
  verdict: Verdict,
  word: string,
  gloss: string,
  closedBefore = false,
) {
  if (verdict === 'converted') {
    return {
      announcement:
        `Red herring converted — you came back and cracked it. ` +
        `${word} means ${gloss}. Case closed: ${word} — ${gloss}.`,
      kicker: 'Red herring converted.',
      flourish: 'Case closed — you came back and cracked it.',
      panelLabel: 'Case closed — learning notes',
    };
  }
  if (verdict === 'solved') {
    return {
      announcement:
        `Correct — ${word} means ${gloss}. Case closed: ${word} — ${gloss}.`,
      kicker: 'Clue confirmed.',
      flourish: 'Case closed.',
      panelLabel: 'Case closed — learning notes',
    };
  }
  if (closedBefore) {
    // The case was closed before this guess — the guess simply
    // does not count; the stamp it already carries stays.
    return {
      announcement:
        `Not this time — ${word} means ${gloss}. ` +
        `Not counted yet — this case was already closed, and its stamp stays.`,
      kicker: 'Not counted yet.',
      flourish: 'This case was already closed — its stamp stays.',
      panelLabel: 'Case already closed — learning notes',
    };
  }
  return {
    announcement:
      `Not this time — ${word} means ${gloss}. ` +
      `Not counted yet — this case stays open, and you can reopen it from the casebook.`,
    kicker: 'Not counted yet.',
    flourish: 'This case stays open — crack it when you are ready.',
    panelLabel: 'Case still open — learning notes',
  };
}

function WordDetectiveDesk() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [active, setActive] = useState<Case | null>(null);
  const [slips, setSlips] = useState<Slip[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [pool, setPool] = useState<VocabEntry[]>([]);
  const [armedLetter, setArmedLetter] = useState<string | null>(null);
  const [records, setRecords] = useState<Record<string, StampState>>(
    // Rehydrate synchronously so a closed dossier loaded from
    // storage never re-fires CASE CLOSED (transition-only, R8).
    loadRecords,
  );
  // Which file is on the desk (w3a, R4/R13). The list is walked
  // FORWARD — the visitor never picks a file, never filters one.
  const [dossierIndex, setDossierIndex] = useState(() =>
    firstOpenFile(loadRecords()),
  );
  const dossier = DOSSIERS[dossierIndex] ?? DOSSIERS[0];
  // The file AFTER this one — the only thing the visitor is ever
  // offered. Null once the last file is reached.
  const nextDossier = DOSSIERS[dossierIndex + 1] ?? null;
  // CASE CLOSED discovery dialog state (b2, §14 focus-managed)
  const [fileShown, setFileShown] = useState(false);
  const [fileWords, setFileWords] = useState<VocabEntry[]>([]);
  const [announcement, setAnnouncement] = useState('');
  // React key for the case card so each draw replays the pop-in.
  const [drawSeq, setDrawSeq] = useState(0);
  // What the last guess DID — the learning panel's voice. 'wrong'
  // is a red herring (an open case), never a closure.
  const [verdict, setVerdict] = useState<VerdictState | null>(null);
  // A visible, recoverable load failure. The loader can fail on a
  // flaky connection (§7.2): the desk says so and offers the retry.
  const [loadFailure, setLoadFailure] = useState<LoadFailure | null>(null);

  // Per-letter no-repeat cycles (ref: never rendered — ordering aid).
  const letterCycles = useRef<Record<string, { order: number[]; pointer: number }>>({});
  // Imperative reentry guard: double-clicks never start two draws
  // across the loader's await.
  const busyRef = useRef(false);
  const caseRef = useRef<HTMLDivElement | null>(null);
  const learnRef = useRef<HTMLDivElement | null>(null);
  const deckRef = useRef<HTMLButtonElement | null>(null);
  const fileBtnRef: RevealFileBtnRef = useRef<HTMLButtonElement | null>(null);
  const revealRef = useRef<HTMLDivElement | null>(null);
  const errorRetryRef = useRef<HTMLButtonElement | null>(null);
  // How many loads have failed in a row (the desk escalates from
  // \"try again\" to \"reload\" \u2014 see loadFailureFor).
  const failureStreakRef = useRef(0);

  // All pinned cases solved-or-converted → the discovery may fire.
  // Derived from records only — the casebook never stores its own
  // copy of the truth (§4 single source).
  const isClosed = useMemo(
    () => isDossierClosed(dossier, records),
    [dossier, records],
  );

  // CASE CLOSED fires ONCE — only on the false→true transition,
  // never re-fires on page load; the stamped file stays re-readable
  // from the casebook [R8/§14].
  const wasClosedRef = useRef(isClosed);
  useEffect(() => {
    if (isClosed && !wasClosedRef.current) setFileShown(true);
    wasClosedRef.current = isClosed;
  }, [isClosed]);

  // The evidence page resolves its words through the lazy loader
  // (cached — R3); on failure the file still reads without it.
  useEffect(() => {
    if (!isClosed) return;
    let cancelled = false;
    loadEntriesByIds(dossier.caseIds)
      .then((entries) => {
        if (!cancelled) setFileWords(entries);
      })
      .catch(() => {
        /* degrade gracefully — no stall (§7.2) */
      });
    return () => {
      cancelled = true;
    };
  }, [isClosed, dossier]);

  // Dialog focus policy: moves in on open, returns on close (§14)
  useEffect(() => {
    if (fileShown) revealRef.current?.focus();
  }, [fileShown]);

  // Persist every records change (ids + states only) [R2/§7.3]
  useEffect(() => {
    saveRecords(records);
  }, [records]);

  /**
   * Reset (b3): clears the casebook — records + stored key — and
   * announces it politely. Scope is the casebook only; the desk's
   * current case is untouched (§7.3: "returns the casebook to
   * empty"). Confirmation lives in the Casebook control (§14/R16).
   */
  const resetCasebook = () => {
    setRecords({});
    setAnnouncement('Casebook reset \u2014 all stamps cleared.');
  };

  /**
   * The casebook's own loader failed. It shows the failure on the
   * page and offers a way back; the ONE live region for this
   * section carries the same news (polite \u2014 never a second live
   * region, never a timer). The setter is stable, so the casebook's
   * loader effect never re-runs because of it.
   */
  const announceCasebookFailure = setAnnouncement;

  const closeFile = () => {
    setFileShown(false);
    (fileBtnRef.current ?? deckRef.current)?.focus();
  };

  /**
   * The quiet line leads somewhere: the contact section (§12). The
   * file closes and the keyboard is handed to the section the
   * visitor asked for — it is never dropped back on the desk (§14).
   * The anchor itself still does the scrolling; the focus move only
   * makes sure the keyboard follows.
   */
  const followContact = () => {
    setFileShown(false);
    const contact = document.getElementById('contact');
    if (!contact) return;
    contact.setAttribute('tabindex', '-1');
    contact.focus();
  };

  /**
   * The advance (w3a): the NEXT file comes to the desk. It is
   * always an explicit action — taken from the CASE CLOSED file, or
   * from the note on the desk once the file is closed. Never
   * automatic, never timed (§14). The stamps of the finished file
   * stay in the casebook: nothing is ever thrown away (§7.3).
   */
  const advanceFile = () => {
    const next = DOSSIERS[dossierIndex + 1];
    if (!next) return;
    setFileShown(false);
    setDossierIndex((index) => index + 1);
    setAnnouncement(`Next file on the desk: ${next.titleEN}. ${next.opening}`);
    deckRef.current?.focus();
  };

  const handleRevealKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    // The dialog owns the keyboard while it is open — nothing
    // bubbles up to the section (which arms letter keys).
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      closeFile();
      return;
    }
    if (event.key !== 'Tab') return;
    // Bounded dialog: Tab cycles the dialog's OWN focusables and
    // never leaves (§14). The quiet line's link and the next-file
    // button are part of that circle — the trap is a list, not a
    // single control.
    const items = focusableIn(revealRef.current);
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = event.shiftKey
      ? (current <= 0 ? items.length - 1 : current - 1)
      : (current + 1) % items.length;
    items[next].focus();
  };

  /**
   * Red-herring REOPEN — a first-class entry into the lifecycle
   * [R6, §6]: same fixed word, FRESH reshuffled slips (never a
   * display-and-convert), announced as its own outcome [§14].
   */
  const reopenCase = async (id: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const restore = phase;
    setPhase('drawing');
    setVerdict(null);
    setLoadFailure(null);
    setAnnouncement('Reopening the file…');
    try {
      const letter = letterOfId(id);
      const entries = await loadLetter(letter);
      const entry = entries.find((candidate) => candidate.id === id);
      if (!entry) throw new Error('case entry not found');
      const glossPool = await loadGlossPool();
      failureStreakRef.current = 0;
      setActive({ letter, entry });
      setSlips(buildSlips(entry.gloss, glossPool));
      setChosen(null);
      setDrawSeq((count) => count + 1);
      setPhase('inspect');
      setAnnouncement(
        `Case reopened for a fresh deduction: ${entry.word}. ` +
          `${entry.sentence} What does \u201C${entry.word}\u201D mean?`,
      );
    } catch {
      setPhase(restore);
      failureStreakRef.current += 1;
      const failure = loadFailureFor(
        { kind: 'reopen', id },
        failureStreakRef.current,
      );
      setLoadFailure(failure);
      setAnnouncement(failure.message);
    } finally {
      busyRef.current = false;
    }
  };

  const question = active
    ? `What does \u201C${active.entry.word}\u201D mean?`
    : 'What does it mean?';

  // Letters with stamped history — a corner-mark discovery cue on
  // the keycap, never a completion tracker (R12; no numerals).
  const stampedLetters = new Set(
    Object.keys(records).map((id) => id.slice(0, id.indexOf('-')).toUpperCase()),
  );

  /**
   * Draw the next case (deck or "Next case" — both land here) [R1].
   * Honors the armed letter (consumed by this draw, and arming
   * never draws), never repeats the case on the table, reshuffles
   * on exhaustion. Data arrives through the lazy loader (R3);
   * failure restores state and invites a retry — no timers.
   */
  const drawCase = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    const arm = armedLetter;
    if (arm !== null) setArmedLetter(null); // selection consumed by this draw
    setPhase('drawing');
    setVerdict(null);
    setLoadFailure(null);
    // The desk says it is pulling the file, and the ONE live region
    // says it too (polite, once per draw — never a timer).
    setAnnouncement('Pulling the file…');
    try {
      let nextCase: Case | null = null;

      if (arm !== null) {
        const entries = await loadLetter(arm);
        if (entries.length > 0) {
          let cycle = letterCycles.current[arm];
          if (!cycle || cycle.pointer >= cycle.order.length) {
            cycle = { order: shuffle(entries.map((_, index) => index)), pointer: 0 };
            letterCycles.current[arm] = cycle;
          }
          let pick = cycle.order[cycle.pointer];
          const sameAsActive =
            active !== null &&
            active.letter === arm &&
            entries[pick].id === active.entry.id;
          if (sameAsActive) {
            // Never draw the entry already on the table (§6).
            if (cycle.pointer + 1 < cycle.order.length) {
              cycle.pointer += 1;
              pick = cycle.order[cycle.pointer];
            } else {
              cycle = { order: shuffle(entries.map((_, index) => index)), pointer: 0 };
              letterCycles.current[arm] = cycle;
              pick = cycle.order[0];
            }
          }
          cycle.pointer += 1;
          nextCase = { letter: arm, entry: entries[pick] };
        }
        // An empty armed pool falls through to a free draw.
      }

      if (nextCase === null) {
        // Free draw over the full pool (loaded on first use).
        let nextPool = pool;
        if (nextPool.length === 0) {
          nextPool = shuffle(await loadAllCases());
          if (nextPool.length === 0) throw new Error('lexicon is empty');
        }
        // Walk the pool in order and take the first entry that is not
        // the one already on the table (§6). The skipped entry is
        // HELD — moved to the back of the pool, never dropped — so
        // the deck is walked evenly: every entry is drawn exactly
        // once per cycle and no slot is silently consumed.
        const onTable = active === null ? null : active.entry.id;
        let index = nextPool.findIndex((entry) => entry.id !== onTable);
        if (index === -1) {
          // Only the case already on the table is left — refill the
          // deck rather than deal the same case twice.
          nextPool = shuffle(await loadAllCases());
          if (nextPool.length === 0) throw new Error('lexicon is empty');
          index = nextPool.findIndex((entry) => entry.id !== onTable);
          if (index === -1) index = 0;
        }
        const item = nextPool[index];
        // The queue keeps every entry that is neither the case just
        // drawn nor the case already on the table — plus the case on
        // the table itself, moved to the BACK. Nothing is dropped.
        setPool([
          ...nextPool.filter(
            (entry) => entry.id !== item.id && entry.id !== onTable,
          ),
          ...nextPool.filter((entry) => entry.id === onTable),
        ]);
        nextCase = { letter: item.letter, entry: item };
      }

      const glossPool = await loadGlossPool();
      failureStreakRef.current = 0;
      setActive(nextCase);
      setSlips(buildSlips(nextCase.entry.gloss, glossPool));
      setChosen(null);
      setDrawSeq((count) => count + 1);
      setPhase('inspect');
      setAnnouncement(
        `New case, letter ${nextCase.letter}: ${nextCase.entry.word}. ` +
          `${nextCase.entry.sentence} What does \u201C${nextCase.entry.word}\u201D mean?`,
      );
    } catch {
      // Loader failure: restore, keep the arm for a retry, never stall.
      if (arm !== null) setArmedLetter(arm);
      setPhase('idle');
      failureStreakRef.current += 1;
      const failure = loadFailureFor({ kind: 'draw' }, failureStreakRef.current);
      setLoadFailure(failure);
      setAnnouncement(failure.message);
    } finally {
      busyRef.current = false;
    }
  };

  /**
   * Retry a failed load — the desk's way back. It repeats the very
   * action that failed (a draw, or a red-herring reopen); it never
   * invents a timer and never leaves the visitor stuck.
   */
  const retryLoad = () => {
    const failure = loadFailure;
    if (failure === null) return;
    if (failure.retry.kind === 'reload') {
      // The browser remembers a module it failed to fetch; a fresh
      // page is the only way back to the case files. The stamps are
      // already stored, so nothing is lost.
      window.location.reload();
      return;
    }
    if (failure.retry.kind === 'reopen') {
      void reopenCase(failure.retry.id);
    } else {
      void drawCase();
    }
  };

  /**
   * The decision. Verdict and learning render in the SAME flow —
   * no timer, no second click, no penalty of any kind (004a §17-1).
   * The guess writes the case's record: correct → solved (a prior
   * red herring → converted); wrong → red herring, except that an
   * already-closed case never downgrades (§4) [Inferred — spec
   * silent on redrawing closed cases; no progress is ever lost].
   *
   * The RECORD is not the VOICE: a wrong guess on an already-closed
   * case keeps its 'solved' record but still reads as an open case.
   * The verdict ('solved' | 'converted' | 'wrong') is what the
   * announcement and the learning panel speak from, so "case closed"
   * can only ever appear for a genuine closure.
   */
  const handleGuess = (index: number) => {
    if (phase !== 'inspect' || chosen !== null || active === null) return;
    const slip = slips[index];
    if (!slip) return;
    const { word, gloss, id } = active.entry;
    const isRight = slip.isCorrect;
    const previous = records[id];
    let outcome: StampState;
    if (isRight) {
      outcome = previous === 'red-herring' ? 'converted' : previous ?? 'solved';
    } else if (previous === 'solved' || previous === 'converted') {
      outcome = previous;
    } else {
      outcome = 'red-herring';
    }
    const kind: Verdict = isRight
      ? outcome === 'converted'
        ? 'converted'
        : 'solved'
      : 'wrong';
    // Was this case already closed when the guess was made? A wrong
    // guess on a closed case changes nothing — the voice says so.
    const closedBefore =
      !isRight && (previous === 'solved' || previous === 'converted');
    setChosen(index);
    setPhase('learn');
    setVerdict({ kind, closedBefore });
    setRecords((prev) => ({ ...prev, [id]: outcome }));
    setAnnouncement(verdictCopy(kind, word, gloss, closedBefore).announcement);
  };

  /**
   * Arm/disarm a letter (keycap click OR physical key — same
   * action). Arming prepares the next case; it never draws and
   * never reveals (R1). Toggling makes mistakes one keypress away.
   */
  const handleArm = (letter: string) => {
    if (armedLetter === letter) {
      setArmedLetter(null);
      setAnnouncement('Armed letter cleared.');
    } else {
      setArmedLetter(letter);
      setAnnouncement(`Next case: letter ${letter}`);
    }
  };

  /**
   * Physical letter keys — handled only while focus is INSIDE the
   * game section (this handler lives on the section, so events
   * from elsewhere never reach it). Modifier combos, Tab, Enter,
   * Space, arrows and IME composition are ignored; nothing is
   * preventDefault'ed, so browse mode and typing stay untouched
   * (§14). ñ arrives as 'ñ' where the layout produces it; the Ñ
   * keycap stays fully usable by pointer/Tab+Enter otherwise
   * (documented, not hidden — §5).
   */
  const handleSectionKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    // The CASE CLOSED dialog is a DOM DESCENDANT of this section,
    // so its keydowns bubble up here. While the file is open, a
    // letter key must not arm a case behind the modal (§14).
    if (fileShown) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.nativeEvent.isComposing) return;
    const key = event.key;
    if (key.length !== 1) return;
    const upper = key.toUpperCase();
    if (upper === '\u00D1' || /^[A-Z]$/.test(upper)) handleArm(upper);
  };

  // One deliberate focus move per state change so focus is never
  // dropped to <body>: draw → the case file; guess → the learning
  // panel (its next Tab reaches "Next case", 004a spec §7).
  useLayoutEffect(() => {
    if (phase === 'learn') {
      learnRef.current?.focus();
    } else if (phase === 'inspect' && drawSeq > 0) {
      caseRef.current?.focus();
    }
  }, [phase, drawSeq]);

  // A failed load parks the keyboard on the way back: the retry
  // control is the only thing that matters on the desk (§7.2).
  useLayoutEffect(() => {
    if (loadFailure !== null) errorRetryRef.current?.focus();
  }, [loadFailure]);

  const chosenSlip = chosen !== null ? slips[chosen] : null;
  const guessWasRight = chosenSlip ? chosenSlip.isCorrect : false;
  const learnOrtho = active ? orthoNote(active.entry) : null;
  // The panel speaks from the verdict — never from the record, so a
  // wrong answer can never borrow the "closed" voice.
  const voice = verdictCopy(
    verdict ? verdict.kind : guessWasRight ? 'solved' : 'wrong',
    active ? active.entry.word : '',
    active ? active.entry.gloss : '',
    verdict ? verdict.closedBefore : false,
  );

  return (
    <section
      className="game-section word-detective"
      aria-labelledby="game-title"
      onKeyDown={handleSectionKeyDown}
    >
      {/* The section's one and only heading — playful identity */}
      <h2 id="game-title" className="wd-title">
        Word Detective
        <svg
          className="wd-title-scribble"
          viewBox="0 0 230 16"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M5 10 C 45 3, 78 14, 118 8 S 186 4, 225 9" />
        </svg>
        <svg
          className="wd-title-glass"
          viewBox="0 0 40 44"
          aria-hidden="true"
          focusable="false"
        >
          <circle cx="16" cy="16" r="11" />
          <path d="M24 24 L35 36" />
          <path d="M11 13 q5 -6 10 0" />
        </svg>
      </h2>

      {/* Which file is on the desk — always visible, so the visitor
          can always tell where they are. It names ONE file: it is
          never a list, a picker or a filter (R13). */}
      <p className="wd-current-file">
        <span className="wd-current-file-label">current file:</span>{' '}
        {dossier.title}
      </p>

      <div className="wd-desk">
        {/* 1 — case zone first in DOM: evidence → question → slips
            → verdict → learning → Next case (spec §7 reading order) */}
        <div className="wd-case-zone" aria-busy={phase === 'drawing' ? true : undefined}>
          {/* The advance, on the desk: once this file is closed the
              next one is waiting. A visitor who closed the CASE
              CLOSED file without taking the next file from the
              dialog finds the way forward here — never a dead end
              (w3a). */}
          {isClosed && !fileShown && nextDossier && (
            <div className="wd-nextfile">
              <p className="wd-nextfile-copy">
                This file is closed. Another one is waiting:
              </p>
              <button
                type="button"
                className="wd-nextfile-btn"
                onClick={advanceFile}
              >
                Next file: {nextDossier.title}
              </button>
            </div>
          )}
          {phase === 'drawing' ? (
            /* The file is being pulled: a visible, honest state in
               the desk's own paper-and-ink language. It is NOT a
               timer and never auto-dismisses — it lives exactly as
               long as the loader promise does. The live region
               carries the same words for screen readers, so the
               card itself is decorative to them. */
            <div className="wd-drawing" aria-hidden="true">
              <p className="wd-drawing-title">Pulling the file…</p>
              <p className="wd-drawing-copy">
                Riffling through the case drawer.
              </p>
              <svg className="wd-drawing-art" viewBox="0 0 120 74" focusable="false">
                <path className="wd-drawing-drawer" d="M8 36 h104 v32 h-104 z" />
                <path className="wd-drawing-handle" d="M46 52 h28" />
                <g className="wd-drawing-sheet">
                  <path className="wd-drawing-paper" d="M34 6 h46 v32 h-46 z" />
                  <path className="wd-drawing-line" d="M42 17 h30 M42 25 h18" />
                </g>
              </svg>
            </div>
          ) : loadFailure !== null ? (
            /* The loader failed: say it on the desk and give the way
               back — never a silent, dead end (§7.2). */
            <div className="wd-error">
              <p className="wd-error-title">The drawer jammed.</p>
              <p className="wd-error-copy">{loadFailure.message}</p>
              <button
                type="button"
                className="wd-error-retry"
                ref={errorRetryRef}
                onClick={retryLoad}
              >
                {loadFailure.retry.kind === 'reload'
                  ? 'Reload the desk'
                  : 'Try again'}
              </button>
            </div>
          ) : active === null ? (
            <div className="wd-idle-note">
              <p className="wd-idle-title">The desk is clear.</p>
              <p className="wd-idle-copy">
                Draw a case from the deck to open one.
              </p>
              <svg
                className="wd-idle-doodle"
                viewBox="0 0 44 48"
                aria-hidden="true"
                focusable="false"
              >
                <circle cx="18" cy="18" r="12" />
                <path d="M27 27 L39 40" />
                <path d="M13 15 q5 -6 10 0" />
                <path d="M6 44 q10 -4 20 0" />
              </svg>
            </div>
          ) : (
            <article
              className="wd-case"
              key={drawSeq}
              ref={caseRef}
              tabIndex={-1}
              aria-label="Active case file"
            >
              {/* letter tab clipped on top of the case file */}
              <span className="wd-case-letter">{active.letter}</span>

              <div className="wd-evidence">
                <p className="wd-word">{active.entry.word}</p>
                <p className="wd-sentence">
                  {renderSentence(
                    active.entry.sentence,
                    active.entry.word,
                    phase === 'learn',
                  )}
                </p>
              </div>

              <p className="wd-question" id="wd-question">
                <svg
                  className="wd-question-glass"
                  viewBox="0 0 40 44"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle cx="16" cy="16" r="11" />
                  <path d="M24 24 L35 36" />
                  <path d="M11 13 q5 -6 10 0" />
                </svg>
                {question}
              </p>

              <div className="wd-slips" role="group" aria-labelledby="wd-question">
                {slips.map((slip, index) => {
                  const isChosen = chosen === index;
                  const isRevealed = chosen !== null;
                  const isClueSlip =
                    isRevealed && slip.isCorrect && !guessWasRight;
                  const verdictSticker = isRevealed && isChosen;
                  return (
                    <button
                      key={slip.id}
                      type="button"
                      className={[
                        'wd-slip',
                        `wd-slip-${index}`,
                        isChosen ? 'is-chosen' : '',
                        isChosen ? (guessWasRight ? 'is-right' : 'is-wrong') : '',
                        isClueSlip ? 'is-clue' : '',
                        isRevealed ? 'is-locked' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={{ '--slip-i': String(index) } as CSSProperties}
                      aria-disabled={isRevealed ? true : undefined}
                      onClick={() => handleGuess(index)}
                    >
                      <span className="wd-slip-tag" aria-hidden="true">
                        <svg viewBox="0 0 24 24" focusable="false">
                          <path d="M12 3.5 l2.4 5 5.5 .7 -4 3.9 1 5.4 -4.9 -2.6 -4.9 2.6 1 -5.4 -4 -3.9 5.5 -.7 z" />
                        </svg>
                        evidence
                      </span>
                      <span className="wd-slip-text">{slip.text}</span>
                      {verdictSticker && (
                        <span className="wd-slip-verdict" aria-hidden="true">
                          {guessWasRight ? '\u2713 Correct' : '\u2717 Not this time'}
                        </span>
                      )}
                      {verdictSticker && (
                        <span className="sr-only">
                          {guessWasRight
                            ? 'your pick \u2014 correct'
                            : 'your pick \u2014 not this time'}
                        </span>
                      )}
                      {isClueSlip && (
                        <>
                          <span className="wd-slip-clue">the clue you needed</span>
                          <span className="sr-only">the correct answer</span>
                          <svg
                            className="wd-ring"
                            viewBox="0 0 200 90"
                            preserveAspectRatio="none"
                            aria-hidden="true"
                            focusable="false"
                          >
                            <ellipse cx="100" cy="45" rx="93" ry="39" />
                          </svg>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Verdict + learning render together on the guess —
                  nothing here waits on a timer (004a §17-1) */}
              {phase === 'learn' && chosenSlip && (
                <div
                  className="wd-learn"
                  ref={learnRef}
                  tabIndex={-1}
                  aria-label={voice.panelLabel}
                >
                  <p className={`wd-learn-kicker ${guessWasRight ? 'is-right' : 'is-wrong'}`}>
                    {voice.kicker}
                  </p>
                  <p className="wd-learn-word">
                    {active.entry.word}
                    <span className="wd-learn-pron">
                      sound it out: {active.entry.syllables}
                    </span>
                  </p>
                  <p className="wd-learn-meaning">
                    means{' '}
                    <span className="wd-gloss-sticker">{active.entry.gloss}</span>
                  </p>
                  {/* §8 optional lines — rendered only when the
                      content slice has filled them in */}
                  {active.entry.glossES && (
                    <p className="wd-learn-alt">{active.entry.glossES}</p>
                  )}
                  {active.entry.sentenceEN && (
                    <p className="wd-learn-alt">{active.entry.sentenceEN}</p>
                  )}
                  {/* §8/§9 orthography micro-note — learning feature,
                      never an alphabet key (R14) */}
                  {learnOrtho && (
                    <p className="wd-learn-ortho">{learnOrtho}</p>
                  )}
                  {/* A conversion says so in WORDS — the stamp
                      colours stay as they are, but the visitor can
                      read that this one came back from the
                      casebook (§14). */}
                  {verdict && verdict.kind === 'converted' && (
                    <p className="wd-learn-note">
                      This one was a red herring before — you reopened
                      it and cracked it.
                    </p>
                  )}
                  <p className="wd-learn-flourish">
                    {voice.flourish}
                    <svg viewBox="0 0 30 24" aria-hidden="true" focusable="false">
                      <path d="M4 14 q6 -10 13 -8 q7 2 9 8" />
                      <path d="M26 14 l-2 7 -5 -4" />
                    </svg>
                  </p>
                  {/* The way back from a red herring, right where the
                      visitor is (w3a). A re-open is a FRESH
                      deduction on the same word with reshuffled
                      slips — never a one-click convert, never a nag,
                      and never on a case that is already closed
                      (R6/§6). */}
                  {verdict &&
                    verdict.kind === 'wrong' &&
                    !verdict.closedBefore && (
                      <div className="wd-learn-reopen">
                        <p className="wd-learn-reopen-copy">
                          This case is still open. Reopen it whenever you
                          like for a fresh set of evidence slips.
                        </p>
                        <button
                          type="button"
                          className="wd-learn-reopen-btn"
                          aria-label={`Reopen the case for ${active.entry.word}`}
                          onClick={() => {
                            const id = active?.entry.id;
                            if (id) void reopenCase(id);
                          }}
                        >
                          Reopen the case
                        </button>
                      </div>
                    )}
                  <button
                    type="button"
                    className="wd-next"
                    aria-label="Draw the next case"
                    onClick={drawCase}
                  >
                    <span className="wd-next-face">
                      Next case
                      <svg viewBox="0 0 34 18" aria-hidden="true" focusable="false">
                        <path d="M2 9 h26" />
                        <path d="M22 3 l7 6 -7 6" />
                      </svg>
                    </span>
                  </button>
                </div>
              )}
            </article>
          )}
        </div>

        {/* 2 — the deck: primary semantic "Draw a case" button,
            rendered as a physical taped pile (004a §17-5, R1) */}
        <button
          type="button"
          className={`wd-deck${phase === 'drawing' ? ' is-busy' : ''}`}
          ref={deckRef}
          aria-busy={phase === 'drawing' ? true : undefined}
          aria-disabled={phase === 'drawing' ? true : undefined}
          aria-label={
            phase === 'drawing'
              ? 'Pulling\u2026 the case file is on its way'
              : armedLetter !== null
                ? `Draw a case \u2014 pull file ${armedLetter}`
                : 'Draw a case from the deck'
          }
          onClick={drawCase}
        >
          {/* armed letter's file folder, sticking up out of the
              deck — visual only, announced by the live region */}
          {armedLetter !== null && (
            <span className="wd-arm-tab" aria-hidden="true">
              {armedLetter}
            </span>
          )}
          <span className="wd-deck-stack" aria-hidden="true">
            <span className="wd-deck-edge wd-deck-edge-3" />
            <span className="wd-deck-edge wd-deck-edge-2" />
            <span className="wd-deck-edge wd-deck-edge-1">
              <span className="wd-deck-mark">?</span>
            </span>
          </span>
          <span
            className={`wd-deck-label${armedLetter !== null ? ' is-armed' : ''}`}
          >
            {phase === 'drawing'
              ? 'Pulling\u2026'
              : armedLetter !== null
                ? `Pull file: ${armedLetter}`
                : 'Draw a case'}
          </span>
        </button>

        {/* 3 — the archive keyboard: keycaps ARM the next case,
            they never draw or reveal (R1) */}
        <div
          className="wd-tabs"
          role="group"
          aria-label="Archive keyboard — arm a letter for the next case"
        >
          <span className="wd-tabs-caption" aria-hidden="true">
            case index
          </span>
          <div className="wd-tabs-row">
            {LETTERS.map((letter) => (
              <button
                key={letter}
                type="button"
                className={[
                  'wd-tab',
                  armedLetter === letter ? 'is-armed' : '',
                  stampedLetters.has(letter) ? 'has-stamps' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={armedLetter === letter}
                aria-label={`Arm the next case for letter ${letter}`}
                onClick={() => handleArm(letter)}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>

        {/* 4 — casebook: the bound notebook — visible truth of
            the case records (§10): mystery board, letter pages,
            clue beats, red-herring reopen entry [R6], and the
            CASE CLOSED file affordance [R8] */}
        <Casebook
          records={records}
          dossier={dossier}
          isClosed={isClosed}
          onOpenFile={() => setFileShown(true)}
          fileBtnRef={fileBtnRef}
          onReopen={reopenCase}
          onReset={resetCasebook}
          onLoadFailure={announceCasebookFailure}
        />

        {/* CASE CLOSED — a bounded discovery payoff INSIDE the
            section: focus-managed, dismissible, no totals or
            checklist energy [R8/§14/§10]; the quiet class line
            closes it [§12] */}
        {fileShown && (
          <div className="wd-reveal-backdrop">
            <div
              className="wd-reveal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="wd-reveal-title"
              ref={revealRef}
              tabIndex={-1}
              onKeyDown={handleRevealKeyDown}
            >
              {/* the newspaper lifts off the tray — a static
                  drawing; meaning never depends on motion [§14] */}
              <svg
                className="wd-reveal-scene"
                viewBox="0 0 240 130"
                aria-hidden="true"
                focusable="false"
              >
                <rect x="40" y="94" width="160" height="26" rx="8" />
                <path d="M74 70 h24 l-3 16 q-1 6 -9 6 q-8 0 -9 -6 z" />
                <path d="M98 74 q8 1 8 7 q0 6 -8 7" />
                <path d="M84 62 q3 -5 0 -9" />
                <ellipse cx="162" cy="90" rx="26" ry="7" />
                <path className="wd-sheet" d="M126 60 L216 24 L228 50 L138 86 Z" />
                <path d="M132 70 L222 34" />
                <path d="M112 56 q7 -11 18 -15" />
                <path d="M120 40 q4 -6 11 -8" />
                <path d="M56 34 l0 12 M50 40 l12 0" />
                <path d="M206 72 l4 8 8 4 -8 4 -4 8 -4 -8 -8 -4 8 -4 z" />
              </svg>
              <h3 id="wd-reveal-title" className="wd-reveal-title">
                {dossier.title}
              </h3>
              <p className="wd-reveal-scene-text">{dossier.reveal.scene}</p>
              <p className="wd-reveal-rank">{dossier.reveal.rank}</p>
              <div className="wd-reveal-page">
                <span className="wd-reveal-page-label" aria-hidden="true">
                  evidence page
                </span>
                <ul className="wd-reveal-words">
                  {dossier.caseIds.map((id) => {
                    const entry = fileWords.find(
                      (candidate) => candidate.id === id,
                    );
                    if (!entry) return null;
                    return (
                      <li key={id}>
                        <span className="wd-rw-word">{entry.word}</span>
                        <span className="wd-rw-gloss">{entry.gloss}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {/* The one quiet §12 line — and it POINTS somewhere:
                  a real link to the contact section (w3a). The
                  visually-hidden prefix makes the accessible name
                  make sense out of context; the inline style
                  guarantees the ≥44px target without waiting for the
                  stylesheet. */}
              <p className="wd-reveal-quiet">
                <a
                  className="wd-reveal-quiet-link"
                  href="#contact"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    minHeight: '44px',
                  }}
                  onClick={followContact}
                >
                  <span className="sr-only">Go to the contact section: </span>
                  {dossier.reveal.quietLine}
                </a>
              </p>
              {/* The advance lives here too: the file names the next
                  one, so the visitor is never left wondering what
                  comes next (w3a). */}
              {nextDossier && (
                <button
                  type="button"
                  className="wd-reveal-close wd-reveal-next"
                  onClick={advanceFile}
                >
                  Next file: {nextDossier.title}
                </button>
              )}
              <button
                type="button"
                className="wd-reveal-close"
                onClick={closeFile}
              >
                Close the file
              </button>
            </div>
          </div>
        )}
      </div>

      {/* One polite live region for the whole section — verdict
          wordings per approved 003 §6; arm actions per 004b §5;
          reopen + conversion outcomes per 004b §14 */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
    </section>
  );
}

/**
 * The desk renders only when there is at least one authored dossier
 * to play. An empty list would be a content error, not a state to
 * design for — so the game simply is not on the page, instead of
 * rendering a broken desk.
 */
export default function WordDetective() {
  if (DOSSIERS.length === 0) return null;
  return <WordDetectiveDesk />;
}
