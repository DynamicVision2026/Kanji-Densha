import { trainsForGrade, getKanji, type Grade } from "@/data/kyoiku";
import type { PracticeKind } from "@/lib/mastery";
import { decorateTrains } from "@/lib/trains";
import { getGradeParams } from "@/lib/grade-params";
import {
  echoAvailable,
  echoIsDue,
  emptyProgress,
  requiredLights,
  suggestBeat,
  utcDay,
  type BeatId,
  type ProgressState,
} from "@/lib/progress-view";
import {
  drawPublishedItems,
  getItem,
  getPhoneticFamilyItem,
  gradeChoice,
  shapeSurfaceAvailable,
  type BankItem,
} from "@/lib/items";
import { justReachedPerfect, mergeStamp, stampFromPerfect, type Stamp } from "@/lib/stamps";
import { mapLinesFor } from "@/lib/lines";
import { buildParentReport } from "@/lib/parent-report";
import { pickWeekPeek } from "@/lib/week-peek";
import { isInspectionDue } from "@/lib/inspection";
import { buildGradeRings } from "@/lib/train-overview";
import {
  demoBoardAndForward,
  demoProfileGrade,
  recordDemoInspection,
  readDemoInspections,
  setDemoStartBand as setBand,
  confirmDemoRollover,
  dismissDemoRollover,
} from "@/lib/demo-route";
import type { StartBand } from "@/lib/grade-route";
import { markHasRidden } from "@/lib/has-ridden";
import {
  EchoRejectedError,
  evaluateProgress,
  initialProgress,
  type CharacterProgress,
} from "@kanji-densha/engine";
import {
  requiredLamps as computeRequiredLamps,
  toEngineGradeParams,
  toLegacyProgressState,
} from "@/lib/legacy-progress-adapter";

// v4: real-engine `CharacterProgress` records, keyed by character (routing.md
// §1/§3 step 1 — the guest path now runs the same evaluateProgress the
// account path does, I5). v3 held the legacy engine's own `ProgressState`
// and is deliberately abandoned rather than migrated: nobody has real guest
// data yet, and reconstructing engine state (echo timestamps, open rounds)
// from the legacy projection's summary fields would be a guess dressed up as
// a migration.
const KEY = "densha.demo.progress.v4";
const EVENT_KEY = "densha.demo.events.v2";
const ECHO_KEY = "densha.demo.echo-starts.v2";
const STAMP_KEY = "densha.demo.stamps.v1";
const TOUCHED_KEY = "densha.demo.touched.v1";

export const DEMO_CHILD = {
  id: "demo",
  name: "そら",
  get grade(): Grade {
    return demoProfileGrade();
  },
};

/** Preview-only: second-echo-due so 到着 can show the green couple beat. Not 王/右 (auto-demo). */
export const DEMO_COUPLE_CHAR = "花";

/** Extra greens so Welcome shows a short moving train (一 + these = 4). */
const DEMO_CONSIST_CHARS = ["音", "下", "火"] as const;

export type DemoEvent = {
  kanji: string;
  kind: PracticeKind;
  correct: boolean;
  answer: string;
  created_at: string;
  item_id: string;
  is_echo: boolean;
  session_id: string;
};

function params() {
  return getGradeParams(DEMO_CHILD.grade);
}

function paramsFor(char: string) {
  return getGradeParams(getKanji(char)?.grade ?? DEMO_CHILD.grade);
}

function engineParamsFor(char: string) {
  return toEngineGradeParams(paramsFor(char));
}

function requiredLampsFor(char: string) {
  return computeRequiredLamps(shapeSurfaceAvailable(char));
}

function nowHours(): number {
  return Date.now() / 3_600_000;
}

function hoursAgo(h: number): number {
  return nowHours() - h;
}

function toLegacyRow(p: CharacterProgress): ProgressState {
  return toLegacyProgressState(p, engineParamsFor(p.characterId));
}

/** A hand-built seed row, not a real evaluatedProgress — see seedMap's own note. */
function seedChar(char: string, patch: Partial<CharacterProgress>): CharacterProgress {
  return { ...initialProgress(char), encountered: true, understood: true, ...patch };
}

/**
 * Hand-built `CharacterProgress` literals, exactly as the old seed built
 * hand-built `ProgressState` literals — bypassing evaluateProgress at seed
 * time (routing.md §1 names this narrow, accepted exception). Echo arrays
 * are filled in consistently with each row's status (e.g. two ok echoes for
 * かんぺき) so a later real answer re-derives the same status, not a
 * contradictory one.
 */
function seedMap(): Record<string, CharacterProgress> {
  const first = trainsForGrade(1)[0];
  const chars = first?.chars ?? ["一", "右", "雨", "円", "王"];
  const out: Record<string, CharacterProgress> = {};

  // chars[0] (一) is deliberately left unseeded: entrance-page.md §5 sends
  // every first-time guest's さわってみる tap straight to /demo/kanji/一,
  // specifically because it is fast to complete honestly from scratch. A
  // perfect seed here would show that guest a character already finished
  // before they had done anything — chars[4] (王) carries the "already
  // かんぺき" demo slot instead, since nothing routes a fresh guest there
  // (prepareDemoTour resets it to empty of its own accord for the guided
  // tour, independent of whatever this function seeds it to).
  out[chars[4] ?? "王"] = seedChar(chars[4] ?? "王", {
    status: "perfect",
    lamps: { reading: true, meaning: true, shape: true },
    almostAt: hoursAgo(48),
    stampedAt: hoursAgo(24),
    echoes: [
      { at: hoursAgo(30), ok: true, sessionId: "seed-echo-0" },
      { at: hoursAgo(25), ok: true, sessionId: "seed-echo-1" },
    ],
  });
  out[chars[1] ?? "右"] = seedChar(chars[1] ?? "右", {
    status: "almost",
    lamps: { reading: true, meaning: true, shape: true },
    almostAt: hoursAgo(30),
    seenSurfaces: [`${chars[1] ?? "右"}:solo`],
  });
  out[chars[2] ?? "雨"] = seedChar(chars[2] ?? "雨", {
    status: "almost",
    lamps: { reading: true, meaning: true, shape: true },
    almostAt: hoursAgo(0),
  });
  out[chars[3] ?? "円"] = seedChar(chars[3] ?? "円", {
    status: "fix",
    lamps: { reading: true, meaning: false, shape: false },
    repairs: ["meaning"],
    lifetimeWrong: { reading: 0, meaning: 1, shape: 0 },
  });
  for (const char of DEMO_CONSIST_CHARS) {
    out[char] = seedChar(char, {
      status: "perfect",
      lamps: { reading: true, meaning: true, shape: true },
      almostAt: hoursAgo(60),
      stampedAt: hoursAgo(36),
      echoes: [
        { at: hoursAgo(45), ok: true, sessionId: `seed-echo-${char}-0` },
        { at: hoursAgo(40), ok: true, sessionId: `seed-echo-${char}-1` },
      ],
    });
  }
  out[DEMO_COUPLE_CHAR] = seedChar(DEMO_COUPLE_CHAR, {
    status: "almost",
    lamps: { reading: true, meaning: true, shape: true },
    almostAt: hoursAgo(200),
    echoes: [{ at: hoursAgo(150), ok: true, sessionId: "seed-echo-couple-0" }],
    seenSurfaces: [`${DEMO_COUPLE_CHAR}:solo`],
  });
  return out;
}

/** Backfills characters a future build added to the seed set. Not a migration
 * from the abandoned v3 shape — v4 never reads v3 at all. */
function migrateDemo(all: Record<string, CharacterProgress>): {
  all: Record<string, CharacterProgress>;
  changed: boolean;
} {
  let changed = false;
  const next = { ...all };
  const seeded = seedMap();
  for (const char of DEMO_CONSIST_CHARS) {
    if (!next[char]) {
      next[char] = seeded[char]!;
      changed = true;
    }
  }
  if (!next[DEMO_COUPLE_CHAR]) {
    next[DEMO_COUPLE_CHAR] = seeded[DEMO_COUPLE_CHAR]!;
    changed = true;
  }
  return { all: next, changed };
}

function readAll(): Record<string, CharacterProgress> {
  if (typeof window === "undefined") return seedMap();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const seeded = seedMap();
      window.localStorage.setItem(KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Record<string, CharacterProgress>;
    const { all, changed } = migrateDemo(parsed);
    if (changed) writeAll(all);
    return all;
  } catch {
    return seedMap();
  }
}

function writeAll(all: Record<string, CharacterProgress>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

function legacyProgressMap(): Map<string, ProgressState> {
  const map = new Map<string, ProgressState>();
  for (const p of Object.values(readAll())) {
    map.set(p.characterId, toLegacyRow(p));
  }
  return map;
}

/** 一 is deliberately never seeded (see seedMap) — the initial stamp set is
 * always empty, exactly as it always was. */
function seedStamps(): Stamp[] {
  return [];
}

function readStamps(): Stamp[] {
  if (typeof window === "undefined") return seedStamps();
  try {
    const raw = window.localStorage.getItem(STAMP_KEY);
    if (!raw) {
      const fromPerfect = [...legacyProgressMap().values()]
        .filter((row) => row.status === "perfect" || row.perfectAt)
        .reduce<Stamp[]>((acc, row) => mergeStamp(acc, stampFromPerfect(row)), []);
      const seeded = fromPerfect.length ? fromPerfect : seedStamps();
      window.localStorage.setItem(STAMP_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as Stamp[];
  } catch {
    return seedStamps();
  }
}

function writeStamps(stamps: Stamp[]) {
  try {
    window.localStorage.setItem(STAMP_KEY, JSON.stringify(stamps));
  } catch {
    /* ignore */
  }
}

function awardIfPerfect(prev: ProgressState | undefined, next: ProgressState) {
  if (!justReachedPerfect(prev, next)) return;
  writeStamps(mergeStamp(readStamps(), stampFromPerfect(next)));
}

function seedEvents(): DemoEvent[] {
  const now = Date.now();
  return [
    {
      kanji: "一",
      kind: "reading",
      correct: true,
      answer: "ひと",
      created_at: new Date(now - 3600_000).toISOString(),
      item_id: "一:reading:0",
      is_echo: false,
      session_id: "seed",
    },
    {
      kanji: "雨",
      kind: "shape",
      correct: false,
      answer: "雪",
      created_at: new Date(now - 1800_000).toISOString(),
      item_id: "雨:shape:0",
      is_echo: false,
      session_id: "seed",
    },
    {
      kanji: "円",
      kind: "meaning",
      correct: false,
      answer: "かね",
      created_at: new Date(now - 600_000).toISOString(),
      item_id: "円:meaning:0",
      is_echo: false,
      session_id: "seed",
    },
  ];
}

function readEvents(): DemoEvent[] {
  if (typeof window === "undefined") return seedEvents();
  try {
    const raw = window.localStorage.getItem(EVENT_KEY);
    if (!raw) {
      const seeded = seedEvents();
      window.localStorage.setItem(EVENT_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as DemoEvent[];
  } catch {
    return seedEvents();
  }
}

function writeEvents(events: DemoEvent[]) {
  try {
    window.localStorage.setItem(EVENT_KEY, JSON.stringify(events.slice(0, 40)));
  } catch {
    /* ignore */
  }
}

function readEchoStarts(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ECHO_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeEchoStarts(starts: string[]) {
  try {
    window.localStorage.setItem(ECHO_KEY, JSON.stringify(starts.slice(0, 40)));
  } catch {
    /* ignore */
  }
}

export function echoesStartedToday(nowIso = new Date().toISOString()): number {
  const day = utcDay(nowIso);
  return readEchoStarts().filter((s) => utcDay(s) === day).length;
}

export function recordEchoStart(nowIso = new Date().toISOString()) {
  const starts = readEchoStarts();
  starts.push(nowIso);
  writeEchoStarts(starts);
}

/**
 * Characters a real interaction touched — distinct from `readAll()`, which
 * also contains the seeded demo fixture (一 かんぺき, 右/雨 だいたい, 円
 * なおし, …) every guest has on first load. Only this set may ever be
 * carried into a real account: importing the seed would hand a brand-new
 * account achievements nobody earned, which is exactly the counterfeit
 * かんぺき entrance-page.md and welcome-screen.md both spend a paragraph
 * ruling out for the demo train — a migrated account is not a demo car, but
 * the same "never show a record that doesn't exist" rule applies to it.
 */
function readTouchedChars(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TOUCHED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function markTouched(char: string) {
  try {
    const touched = new Set(readTouchedChars());
    touched.add(char);
    window.localStorage.setItem(TOUCHED_KEY, JSON.stringify([...touched]));
  } catch {
    /* ignore */
  }
}

/**
 * Guest progress eligible for account migration: touched characters only,
 * already in the real engine's own shape — `onboard.tsx` hands these
 * straight to `importGuestProgress` with no adapter step, since both sides
 * of the guest/account split now speak `CharacterProgress` natively.
 */
export function readMigratableProgress(): Record<string, CharacterProgress> {
  const all = readAll();
  const touched = new Set(readTouchedChars());
  const out: Record<string, CharacterProgress> = {};
  for (const char of touched) {
    if (all[char]) out[char] = all[char];
  }
  return out;
}

function persist(char: string, next: CharacterProgress): CharacterProgress {
  const all = readAll();
  const prev = all[char];
  all[char] = next;
  writeAll(all);
  markTouched(char);
  const engineParams = engineParamsFor(char);
  awardIfPerfect(
    prev ? toLegacyProgressState(prev, engineParams) : undefined,
    toLegacyProgressState(next, engineParams),
  );
  return next;
}

function getRawStudy(char: string): CharacterProgress {
  return readAll()[char] ?? initialProgress(char);
}

export function getDemoStudy(char: string): ProgressState {
  return toLegacyRow(getRawStudy(char));
}

/** No engine event: opening a kanji is not a scoring moment (MR-8 — decay,
 * the old model's only "open" effect, does not exist in the real engine). */
export function openDemoKanji(char: string): ProgressState {
  return getDemoStudy(char);
}

export function completeDemoEncounter(char: string): ProgressState {
  const engineParams = engineParamsFor(char);
  const required = requiredLampsFor(char);
  const next = evaluateProgress(
    getRawStudy(char),
    { type: "encounter", at: nowHours(), sessionId: `demo-${char}-encounter` },
    engineParams,
    required,
  );
  markHasRidden();
  persist(char, next);
  return toLegacyProgressState(next, engineParams);
}

export function completeDemoUnderstand(char: string): ProgressState {
  const engineParams = engineParamsFor(char);
  const required = requiredLampsFor(char);
  const next = evaluateProgress(
    getRawStudy(char),
    { type: "understand", at: nowHours(), sessionId: `demo-${char}-understand` },
    engineParams,
    required,
  );
  persist(char, next);
  return toLegacyProgressState(next, engineParams);
}

export function demoBeat(char: string): BeatId {
  const now = new Date().toISOString();
  return suggestBeat(
    getDemoStudy(char),
    paramsFor(char),
    shapeSurfaceAvailable(char),
    now,
    echoesStartedToday(now),
  );
}

export function demoEchoOn(char: string): boolean {
  const now = new Date().toISOString();
  return echoAvailable(getDemoStudy(char), now, echoesStartedToday(now), paramsFor(char));
}

export function drawDemoItems(char: string, mode: "session" | "echo"): BankItem[] {
  const p = paramsFor(char);
  const shape = shapeSurfaceAvailable(char);
  const kinds = requiredLights(p, shape);
  const progress = getDemoStudy(char);
  const sessionKinds =
    mode === "echo"
      ? kinds
      : kinds.filter((k) => !progress.lights[k] || progress.repairRequiredKinds.includes(k));
  return drawPublishedItems({
    kanji: char,
    kinds: sessionKinds.length ? sessionKinds : kinds,
    seed: `${DEMO_CHILD.id}|${char}|${mode}|0`,
    maxPerKind: p.max_items_per_kind_per_session,
    maxTotal: mode === "echo" ? kinds.length * p.echo_items_per_light : p.max_items_per_session,
    echo: mode === "echo" ? { lastSuccessByKind: progress.lastSuccessByKind, seenIds: progress.surfacesSeenSuccess } : undefined,
  });
}

export function submitDemoAnswer(input: {
  char: string;
  itemId: string;
  choiceId: string;
  isEcho: boolean;
  echoBatchDone: boolean;
  sessionId: string;
}): { correct: boolean; label: string; progress: ProgressState; gradePerfect?: number } {
  const item = getItem(input.itemId, true);
  if (!item || item.kanji !== input.char) {
    throw new Error("unknown item");
  }
  const graded = gradeChoice(item, input.choiceId);

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const engineParams = engineParamsFor(input.char);
  const required = requiredLampsFor(input.char);
  const prev = getRawStudy(input.char);
  const prevLegacy = toLegacyProgressState(prev, engineParams);
  const wantsEcho = input.isEcho && echoIsDue(prevLegacy, nowIso);
  const surfaceId = item.surfaceId ?? item.payload.surface?.id ?? `${item.kanji}:solo`;
  const soft = Boolean(item.payload.confusable || item.payload.phoneticFamily || item.payload.cloze);

  const attempt = (mode: "practice" | "echo"): CharacterProgress =>
    evaluateProgress(
      prev,
      {
        type: "answer",
        at: nowHours(),
        sessionId: input.sessionId,
        itemId: input.itemId,
        lamp: item.kind,
        correct: graded.correct,
        mode,
        surfaceId,
        soft,
      },
      engineParams,
      required,
    );

  let scoringEcho = wantsEcho;
  let next: CharacterProgress;
  try {
    next = attempt(wantsEcho ? "echo" : "practice");
  } catch (err) {
    if (!(err instanceof EchoRejectedError) || !wantsEcho) throw err;
    // Same MR-5 authority rule as the account path (server/progress.ts): the
    // engine's own eligibility check wins over this file's echoIsDue guess.
    // The child never sees this — it falls back to silent practice scoring.
    scoringEcho = false;
    next = attempt("practice");
  }

  persist(input.char, next);
  const nextLegacy = toLegacyProgressState(next, engineParams);

  if (
    prevLegacy.status === "perfect" &&
    nextLegacy.status === "perfect" &&
    isInspectionDue(prevLegacy, readDemoInspections()[input.char], nowIso)
  ) {
    recordDemoInspection(input.char, nowIso);
  }

  const events = readEvents();
  events.unshift({
    kanji: input.char,
    kind: item.kind,
    correct: graded.correct,
    answer: graded.label,
    created_at: nowIso,
    item_id: input.itemId,
    is_echo: scoringEcho,
    session_id: input.sessionId,
  });
  writeEvents(events);
  const rings = buildGradeRings({ progress: legacyProgressMap(), profileGrade: DEMO_CHILD.grade });
  const g = (getKanji(input.char)?.grade ?? DEMO_CHILD.grade) as Grade;
  const gradePerfect = rings.find((r) => r.grade === g)?.perfect ?? 0;
  return { correct: graded.correct, label: graded.label, progress: nextLegacy, gradePerfect };
}

/** Workshop: UI-only 当たり / 半分当たり. Never writes mastery. */
export function applyDemoWorkshop(kanji: string, choiceId: string) {
  const item = getPhoneticFamilyItem(kanji);
  if (!item) return null;
  return gradeChoice(item, choiceId);
}

export function getDemoHome(viewGrade: Grade = DEMO_CHILD.grade) {
  const now = new Date().toISOString();
  const p = params();
  const map = legacyProgressMap();
  const trains = decorateTrains(viewGrade, map).map((t) => ({
    ...t,
    cars: t.cars.map((car) => ({
      ...car,
      echoDue: echoIsDue(map.get(car.char) ?? emptyProgress(car.char), now),
      echoDueAt: (map.get(car.char) ?? emptyProgress(car.char)).echoDueAt,
    })),
  }));
  const total = trains.reduce((n, t) => n + t.cars.length, 0);
  const gradeChars = new Set(trains.flatMap((t) => t.chars));
  const perfect = [...map.values()].filter(
    (row) => row.status === "perfect" && gradeChars.has(row.kanji),
  ).length;
  const rings = buildGradeRings({ progress: map, profileGrade: DEMO_CHILD.grade });
  const echoQueue = [...map.values()]
    .filter((row) => echoAvailable(row, now, 0, p))
    .slice(0, Math.max(0, p.echo_per_day_cap - echoesStartedToday(now)));
  const seenToday = [...map.values()].filter(
    (row) => row.seenAt && utcDay(row.seenAt) === utcDay(now),
  ).length;
  return {
    child: DEMO_CHILD,
    viewGrade,
    trains,
    total,
    perfect,
    echoQueue,
    seenToday,
    maxNew: p.max_new_per_day,
    peek: pickWeekPeek({ progress: map, grade: viewGrade }),
    board: demoBoardAndForward({ progress: map, events: readEvents(), nowIso: now }).board,
    rings,
  };
}

export function listDemoEchoQueue() {
  return getDemoHome().echoQueue;
}

export function listDemoEvents(): DemoEvent[] {
  return readEvents();
}

export function listDemoMistakes(): DemoEvent[] {
  return readEvents().filter((e) => !e.correct);
}

export function listDemoStamps(): Stamp[] {
  return readStamps();
}

export function getDemoMap(viewGrade: Grade = DEMO_CHILD.grade) {
  const now = new Date().toISOString();
  const map = legacyProgressMap();
  const lines = mapLinesFor(viewGrade).map((view) => ({
    ...view,
    stations: view.stations.map((station) => ({
      ...station,
      status: map.get(station.kanji)?.status ?? "new",
      echoDue: echoIsDue(map.get(station.kanji) ?? emptyProgress(station.kanji), now),
      echoDueAt: (map.get(station.kanji) ?? emptyProgress(station.kanji)).echoDueAt,
    })),
  }));
  return { child: DEMO_CHILD, viewGrade, lines, progress: map };
}

export function getDemoOverview() {
  const home = getDemoHome();
  const stamps = readStamps();
  const progressMap = legacyProgressMap();
  const report = buildParentReport({
    grade: DEMO_CHILD.grade,
    progress: progressMap,
    events: readEvents(),
    stamps,
  });
  const lines = report.lines.map((line) => ({
    id: line.id,
    label: line.label,
    type: line.type,
    done: line.perfect,
    total: line.total,
  }));
  const extra = demoBoardAndForward({
    progress: progressMap,
    events: readEvents(),
  });
  return {
    child: DEMO_CHILD,
    trains: home.trains,
    counts: report.counts,
    recent: readEvents(),
    started: Object.keys(readAll()).length,
    total: home.total,
    perfect: home.perfect,
    stamps,
    stampCount: stamps.length,
    lines,
    report,
    route: extra.route,
    plan: extra.plan,
    forward: extra.forward,
    progress: progressMap,
    history: extra.history,
    arrival: extra.arrival,
    canRollover: extra.canRollover,
    aprilPrompt: extra.aprilPrompt,
  };
}

export function setDemoStartBand(band: StartBand) {
  return setBand(band, legacyProgressMap());
}

export function setDemoRollover() {
  return confirmDemoRollover(legacyProgressMap());
}

export function setDemoRolloverDismiss() {
  dismissDemoRollover();
}

/** Reset 王 (new) and 右 (echo-due) so the in-app auto-demo can replay cleanly. */
export function prepareDemoTour() {
  const all = readAll();
  all["王"] = initialProgress("王");
  all["右"] = seedChar("右", {
    status: "almost",
    lamps: { reading: true, meaning: true, shape: true },
    almostAt: hoursAgo(30),
    seenSurfaces: ["右:solo"],
  });
  writeAll(all);
  writeEchoStarts([]);
}
