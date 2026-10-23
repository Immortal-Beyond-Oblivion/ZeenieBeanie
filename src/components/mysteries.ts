// ============================================================
// Word Detective — dossier definitions (Slice 004b, spec §11)
//
// Dossiers are DATA, not code: a case list + clue beats + a
// reveal payload. Adding a mystery later is authoring, not
// engineering. Launch shipped ONE starter mystery; nothing
// hard-codes "exactly one" — the game resolves whatever is in
// `DOSSIERS` and plays the first [Locked — R4].
//
// Every pinned case id exists in the current 81-entry prototype
// dataset, so the mysteries are playable before any lexicon
// expansion [Locked — R5].
//
// WORD-STYLE RULE (new dossiers): a Spanish noun is never put
// in an English grammatical slot. English prose carries the
// meaning, the Spanish word rides along in brackets —
// "the tree (árbol)", never "the árbol". Spanish sentences
// (openings) use real Spanish articles — "la música".
//
// ⚠️ DRAFT CONTENT — narrative flavor only, pending instructor
// review. No instructor claims, pricing, or guarantees (AGENTS.md);
// the closing line stays generic until roadmap 006/007 define
// real contact/booking content (spec §12).
// ============================================================

/** A clue beat — reward as pinned paper, never a number [R7]. */
export interface ClueBeat {
  /** Pinned cases that must be solved/converted to pin this note. */
  threshold: number;
  /** Draft note text (English frame + Spanish words). */
  note: string;
  /** Doodle that pins with the note (component draws it). */
  art?: 'footprints' | 'crumbs';
}

/** The discovery payoff payload — text lives here, the scene
 *  illustration is drawn by the component from `sceneArt`. */
export interface RevealPayload {
  sceneArt: 'newspaper-tray';
  /** Draft resolution line. */
  scene: string;
  /** Flavor rank — narrative, never a score or tier [R7]. */
  rank: string;
  /** The one quiet §12 class line. */
  quietLine: string;
}

export interface Dossier {
  id: string;
  /** Spanish title. */
  title: string;
  titleEN: string;
  /** Draft opening line. */
  opening: string;
  /** Pinned word ids (stable lexicon ids, spec §7.1). */
  caseIds: string[];
  /** Ordered clue beats (thresholds ascending). */
  beats: ClueBeat[];
  reveal: RevealPayload;
}

/**
 * "El misterio del desayuno perdido" — The Case of the Missing
 * Breakfast: the launch dossier (spec §11) [Locked — R4].
 */
export const STARTER_MYSTERY: Dossier = {
  id: 'desayuno-perdido',
  title: 'El misterio del desayuno perdido',
  titleEN: 'The Case of the Missing Breakfast',
  opening:
    'El desayuno ha desaparecido… y con él, la taza favorita. — The breakfast has vanished… and with it, the favourite cup.',
  caseIds: [
    'm-mesa',
    't-taza',
    'p-pan',
    's-silla',
    'a-agua',
    'v-vaso',
    'q-queso',
    'c-comida',
  ],
  beats: [
    {
      threshold: 3,
      art: 'footprints',
      note: 'A doodled footprint beside the chair (silla) — something carried the tray.',
    },
    {
      threshold: 5,
      art: 'crumbs',
      note: 'A crumb trail of bread (pan) and a smear of cheese (queso) heading away from the table (mesa)… toward the door.',
    },
  ],
  reveal: {
    sceneArt: 'newspaper-tray',
    scene:
      'The breakfast was never gone — it was on the table (mesa) the whole time, under the newspaper.',
    rank: 'Detective del Desayuno',
    quietLine: 'Cases like these become classes — book a trial when you’re ready.',
  },
};

/**
 * "El misterio del bosque" — The Mystery of the Woods: a cat
 * and a rose go missing; the woods keep the receipts.
 */
export const BOSQUE_MYSTERY: Dossier = {
  id: 'misterio-del-bosque',
  title: 'El misterio del bosque',
  titleEN: 'The Mystery of the Woods',
  opening:
    'El bosque ha perdido un gato y una rosa del jardín. — The woods lost a cat and a rose from the garden.',
  caseIds: [
    'a-arbol',
    'f-flor',
    'h-hoja',
    'z-zorro',
    'o-oveja',
    'g-gato',
    'p-perro',
    'r-rosa',
  ],
  beats: [
    {
      threshold: 2,
      art: 'crumbs',
      note: 'Rose petals (rosa) scattered like crumbs on the path — the bush was shaken.',
    },
    {
      threshold: 4,
      art: 'footprints',
      note: 'Tiny prints stop at the tree (árbol); a leaf (hoja) is caught in the bark.',
    },
    {
      threshold: 6,
      art: 'footprints',
      note: 'A fox (zorro) watches the roots; sheep wool (oveja) is snagged in the grass.',
    },
  ],
  reveal: {
    sceneArt: 'newspaper-tray',
    scene:
      'The cat (gato) was never lost — it chased the fox (zorro) up the tree (árbol), shook the rose (rosa) down, and the sheep (oveja) ate the petals. The dog (perro) barked the whole time.',
    rank: 'Detective del Bosque',
    quietLine: 'Words like these come alive in class — try a trial lesson when you are ready.',
  },
};

/**
 * "El misterio de la música" — The Case of the Missing Music:
 * the school's concert gear slips away before the bell.
 */
export const MUSICA_MYSTERY: Dossier = {
  id: 'misterio-de-la-musica',
  title: 'El misterio de la música',
  titleEN: 'The Case of the Missing Music',
  opening:
    'La música de la escuela ha desaparecido antes del concierto. — The school lost its music before the concert.',
  caseIds: [
    'e-escuela',
    'g-guitarra',
    'm-musica',
    'j-juego',
    'r-reloj',
    'l-libro',
    'x-xilofono',
    'k-kiosco',
  ],
  beats: [
    {
      threshold: 2,
      art: 'footprints',
      note: 'Small prints cross the school (escuela) floor — the class emptied out at the bell.',
    },
    {
      threshold: 4,
      art: 'crumbs',
      note: 'Crumbs from the kiosk (kiosco) are stuck to a guitar (guitarra) case, left open on the bench.',
    },
    {
      threshold: 6,
      art: 'footprints',
      note: 'The clock (reloj) was reset by hand; the xilófono (xylophone) waits under a book (libro) in the music (música) room.',
    },
  ],
  reveal: {
    sceneArt: 'newspaper-tray',
    scene:
      'Nothing was stolen — the class hid the guitar (guitarra) and the xilófono (xylophone) for the concert after the kiosk (kiosco). The game (juego) ended when the clock (reloj) struck the hour.',
    rank: 'Detective de la Música',
    quietLine: 'Every clue here is a word you can learn — book a trial class and we will start there.',
  },
};

/**
 * "El misterio del viaje perdido" — The Case of the Lost Trip:
 * a traveller leaves the beach and never reaches the boat.
 */
export const VIAJE_MYSTERY: Dossier = {
  id: 'misterio-del-viaje-perdido',
  title: 'El misterio del viaje perdido',
  titleEN: 'The Case of the Lost Trip',
  opening:
    'El viaje se perdió entre la playa y la isla. — The trip got lost between the beach and the island.',
  caseIds: [
    'v-viaje',
    'b-barco',
    'i-isla',
    'p-playa',
    'o-oro',
    'u-uniforme',
    'z-zapato',
    'k-kiwi',
  ],
  beats: [
    {
      threshold: 2,
      art: 'footprints',
      note: 'One shoe (zapato) and a uniform (uniforme) left in the sand (playa) — the traveller left in a hurry.',
    },
    {
      threshold: 4,
      art: 'crumbs',
      note: 'Green crumbs of kiwi (kiwi) on a ticket stub — the wait was long.',
    },
    {
      threshold: 6,
      art: 'footprints',
      note: 'A gold (oro) coin half-buried at the water’s edge, beside the boat (barco) rope.',
    },
  ],
  reveal: {
    sceneArt: 'newspaper-tray',
    scene:
      'The trip (viaje) was never lost — a gold (oro) coin bought a seat on the next boat (barco) to the island (isla). The shoe (zapato), the uniform (uniforme) and the last kiwi (kiwi) stayed on the beach (playa).',
    rank: 'Detective del Viaje',
    quietLine: 'Stories like this turn into lessons — book a trial when you are ready.',
  },
};

/** All authored dossiers: the starter first, then the new mysteries. */
export const DOSSIERS: Dossier[] = [
  STARTER_MYSTERY,
  BOSQUE_MYSTERY,
  MUSICA_MYSTERY,
  VIAJE_MYSTERY,
];
