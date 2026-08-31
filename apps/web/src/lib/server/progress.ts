import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { Grade } from "@/data/kyoiku";
import { getKanji } from "@/data/kyoiku";
import { decorateTrains, type TrainView } from "@/lib/trains";
import { parseKinds, type MasteryStatus, type PracticeKind } from "@/lib/mastery";
import { getGradeParams } from "@/lib/grade-params";
import { parseGrade } from "@/lib/grade-nav";
import {
  echoAvailable,
  echoIsDue,
  emptyProgress,
  utcDay,
  type ProgressState,
} from "@/lib/progress-view";
import {
  EchoRejectedError,
  evaluateProgress,
  initialProgress,
  type CharacterProgress,
  type EchoAttempt,
  type Lamp,
  type OpenEcho,
} from "@kanji-densha/engine";
import {
  requiredLamps as computeRequiredLamps,
  toEngineGradeParams,
  toLegacyProgressState,
} from "@/lib/legacy-progress-adapter";
import { mergeGuestProgress } from "@/lib/guest-import";
import { getItem, gradeChoice, shapeSurfaceAvailable } from "@/lib/items";
import { mapLinesFor } from "@/lib/lines";
import { justReachedPerfect, stampFromPerfect, type Stamp } from "@/lib/stamps";
import { buildParentReport, type ReportEvent } from "@/lib/parent-report";
import { pickWeekPeek } from "@/lib/week-peek";
import { buildDepartureBoard } from "@/lib/departure-board";
import { buildForwardMetrics } from "@/lib/parent-forward";
import { buildProjectedArrival } from "@/lib/projected-arrival";
import { canAdvanceGrade, shouldShowAprilPrompt } from "@/lib/grade-rollover";
import { buildWeeklyPlan } from "@/lib/weekly-plan";
import { buildGradeRings } from "@/lib/train-overview";
import {
  ensureChildPlan,
  listChildRoutes,
  loadChildRoute,
  loadInspections,
  maybeRecordInspection,
} from "@/lib/server/grade-route";

export type { TrainView } from "@/lib/trains";
export type { ProgressState } from "@/lib/progress-view";

function asStatus(raw: string): MasteryStatus {
  if (raw === "lost" || raw === "fix" || raw === "almost" || raw === "perfect") return raw;
  return "new";
}

function asBool(v: unknown): boolean {
  return v === true || v === "t" || v === "true" || v === 1 || v === "1";
}

function parseCountMap(raw: unknown): ProgressState["wrongCountByKind"] {
  const zero = { reading: 0, meaning: 0, shape: 0 };
  if (!raw) return { ...zero };
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!v || typeof v !== "object") return { ...zero };
    const o = v as Record<string, unknown>;
    return {
      reading: Number(o.reading ?? 0) || 0,
      meaning: Number(o.meaning ?? 0) || 0,
      shape: Number(o.shape ?? 0) || 0,
    };
  } catch {
    return { ...zero };
  }
}

function parseStringList(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  try {
    const v = JSON.parse(String(raw));
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return String(raw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

function iso(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  const s = String(v);
  if (!s || s === "null") return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

// Hours since the Unix epoch — the real engine's own time unit (evaluate.ts:
// "at and the *DelayHours grade params share one time unit"). Converted at
// this DB boundary only; nothing else in the app ever sees engine hours.
function toHours(ms: number): number {
  return ms / 3_600_000;
}
function hoursFromTimestamp(v: unknown): number | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(String(v));
  const ms = d.getTime();
  return Number.isNaN(ms) ? null : toHours(ms);
}
function timestampFromHours(h: number | null): Date | null {
  return h === null ? null : new Date(h * 3_600_000);
}

function parseEchoes(raw: unknown): readonly EchoAttempt[] {
  if (!raw) return [];
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(v)) return [];
    return v.map((e: Record<string, unknown>) => ({
      at: Number(e?.at ?? 0),
      ok: Boolean(e?.ok),
      sessionId: String(e?.sessionId ?? ""),
    }));
  } catch {
    return [];
  }
}

function parseOpenEcho(raw: unknown): OpenEcho | null {
  if (!raw) return null;
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    return {
      startedAt: Number(o.startedAt ?? 0),
      sessionId: String(o.sessionId ?? ""),
      results: (o.results ?? {}) as Partial<Record<Lamp, boolean>>,
    };
  } catch {
    return null;
  }
}

// Reads a `kanji_progress` row straight into the real engine's own shape.
// This is the only place a DB row becomes a `CharacterProgress` — write
// handlers evaluate against this, never against the legacy projection below.
function rowToProgress(r: Record<string, unknown>): CharacterProgress {
  return {
    characterId: String(r.kanji),
    status: asStatus(String(r.status ?? "new")),
    lamps: {
      reading: asBool(r.lights_reading),
      meaning: asBool(r.lights_meaning),
      shape: asBool(r.lights_shape),
    },
    encountered: asBool(r.encounter_completed),
    understood: asBool(r.understand_completed),
    repairs: parseKinds(String(r.repair_required_kinds ?? "")),
    lostFlag: asBool(r.lost_flag),
    consecutiveWrong: parseCountMap(r.consecutive_wrong_by_kind),
    lifetimeWrong: parseCountMap(r.wrong_count_by_kind),
    almostAt: hoursFromTimestamp(r.almost_at),
    almostSessionId: r.almost_session_id ? String(r.almost_session_id) : null,
    echoes: parseEchoes(r.echoes),
    openEcho: parseOpenEcho(r.open_echo),
    seenSurfaces: parseStringList(r.surfaces_seen_success),
    novelFailures: parseStringList(r.novel_failures),
    stampedAt: hoursFromTimestamp(r.perfect_at),
  };
}

export async function loadProgress(userId: string, childId: string) {
  const sql = await getSql();
  const owned = await sql<{ id: string; grade: number; name: string }>`
    select id, grade, name from children
    where id = ${childId} and user_id = ${userId}
  `;
  const child = owned[0];
  if (!child) throw new Error("こどもが見つかりません");
  const rows = await sql.query<Record<string, unknown>>(
    `select * from kanji_progress where child_id = $1 and user_id = $2`,
    [childId, userId],
  );
  // `progressMap` is the real engine state — write handlers evaluate against
  // it. `map` is the one-way legacy projection (legacy-progress-adapter.ts)
  // every pre-harvest read consumer already expects; building it here means
  // every read-only handler below is unchanged from before the engine swap.
  const progressMap = new Map<string, CharacterProgress>();
  const map = new Map<string, ProgressState>();
  for (const r of rows) {
    const progress = rowToProgress(r);
    progressMap.set(progress.characterId, progress);
    const params = toEngineGradeParams(
      paramsForChar(progress.characterId, child.grade as Grade),
    );
    map.set(progress.characterId, toLegacyProgressState(progress, params));
  }
  return {
    child: { id: child.id, name: child.name, grade: child.grade as Grade },
    map,
    progressMap,
  };
}

async function saveProgress(userId: string, childId: string, progress: CharacterProgress) {
  const sql = await getSql();
  await sql.query(
    `insert into kanji_progress (
      user_id, child_id, kanji, status,
      lights_reading, lights_meaning, lights_shape,
      encounter_completed, understand_completed,
      almost_at, perfect_at,
      wrong_count_by_kind, consecutive_wrong_by_kind, repair_required_kinds,
      surfaces_seen_success,
      almost_session_id, lost_flag, novel_failures, open_echo, echoes,
      updated_at
    ) values (
      $1,$2,$3,$4,
      $5,$6,$7,
      $8,$9,
      $10,$11,
      $12,$13,$14,
      $15,
      $16,$17,$18,$19,$20,
      now()
    )
    on conflict (child_id, kanji)
    do update set
      status = excluded.status,
      lights_reading = excluded.lights_reading,
      lights_meaning = excluded.lights_meaning,
      lights_shape = excluded.lights_shape,
      encounter_completed = excluded.encounter_completed,
      understand_completed = excluded.understand_completed,
      almost_at = excluded.almost_at,
      perfect_at = excluded.perfect_at,
      wrong_count_by_kind = excluded.wrong_count_by_kind,
      consecutive_wrong_by_kind = excluded.consecutive_wrong_by_kind,
      repair_required_kinds = excluded.repair_required_kinds,
      surfaces_seen_success = excluded.surfaces_seen_success,
      almost_session_id = excluded.almost_session_id,
      lost_flag = excluded.lost_flag,
      novel_failures = excluded.novel_failures,
      open_echo = excluded.open_echo,
      echoes = excluded.echoes,
      updated_at = now()
    where kanji_progress.user_id = $1`,
    [
      userId,
      childId,
      progress.characterId,
      progress.status,
      progress.lamps.reading,
      progress.lamps.meaning,
      progress.lamps.shape,
      progress.encountered,
      progress.understood,
      timestampFromHours(progress.almostAt),
      timestampFromHours(progress.stampedAt),
      JSON.stringify(progress.lifetimeWrong),
      JSON.stringify(progress.consecutiveWrong),
      progress.repairs.join(","),
      JSON.stringify(progress.seenSurfaces),
      progress.almostSessionId,
      progress.lostFlag,
      JSON.stringify(progress.novelFailures),
      progress.openEcho ? JSON.stringify(progress.openEcho) : null,
      JSON.stringify(progress.echoes),
    ],
  );
}

async function listStamps(userId: string, childId: string): Promise<Stamp[]> {
  const sql = await getSql();
  await sql`
    insert into child_stamps (user_id, child_id, kanji, perfect_at, line_ids)
    select user_id, child_id, kanji, coalesce(perfect_at, updated_at), '[]'
    from kanji_progress
    where user_id = ${userId}
      and child_id = ${childId}
      and (status = 'perfect' or perfect_at is not null)
    on conflict (child_id, kanji) do nothing
  `;
  const rows = await sql<{
    kanji: string;
    perfect_at: string | Date;
    line_ids: string;
  }>`
    select kanji, perfect_at, line_ids
    from child_stamps
    where user_id = ${userId} and child_id = ${childId}
    order by perfect_at desc
  `;
  return rows.map((r) => ({
    kanji: r.kanji,
    perfect_at: iso(r.perfect_at) ?? "",
    line_ids: parseStringList(r.line_ids),
  }));
}

async function awardStamp(userId: string, childId: string, prev: ProgressState, next: ProgressState) {
  if (!justReachedPerfect(prev, next)) return;
  const stamp = stampFromPerfect(next);
  const sql = await getSql();
  await sql`
    insert into child_stamps (user_id, child_id, kanji, perfect_at, line_ids)
    values (
      ${userId}, ${childId}, ${stamp.kanji}, ${stamp.perfect_at}, ${JSON.stringify(stamp.line_ids ?? [])}
    )
    on conflict (child_id, kanji) do nothing
  `;
}

async function recordEchoRejection(input: {
  userId: string;
  childId: string;
  kanji: string;
  sessionId: string;
  clause: string;
  message: string;
  almostAt: Date | null;
  attemptedAt: Date;
  eligibleAtIso: string | null;
}) {
  const sql = await getSql();
  const deltaHours =
    input.eligibleAtIso === null
      ? null
      : (input.attemptedAt.getTime() - Date.parse(input.eligibleAtIso)) / 3_600_000;
  await sql`
    insert into echo_rejections (
      user_id, child_id, kanji, session_id, clause, message, almost_at, attempted_at, delta_hours
    )
    values (
      ${input.userId}, ${input.childId}, ${input.kanji}, ${input.sessionId},
      ${input.clause}, ${input.message}, ${input.almostAt}, ${input.attemptedAt}, ${deltaHours}
    )
  `;
}

async function echoStartsToday(userId: string, childId: string, nowIso: string) {
  const sql = await getSql();
  const day = utcDay(nowIso);
  const rows = await sql<{ n: number }>`
    select count(distinct session_id)::int as n
    from practice_events
    where user_id = ${userId}
      and child_id = ${childId}
      and is_echo = true
      and created_at >= ${`${day}T00:00:00.000Z`}::timestamptz
  `;
  return Number(rows[0]?.n ?? 0);
}

function paramsForChar(char: string, fallback: Grade) {
  return getGradeParams(getKanji(char)?.grade ?? fallback);
}

export const getHomeState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { childId: string; grade?: number }) => input)
  .handler(async ({ context, data }) => {
    const { child, map } = await loadProgress(context.userId, data.childId);
    const now = new Date().toISOString();
    const viewGrade = parseGrade(data.grade) ?? child.grade;
    const p = getGradeParams(child.grade);
    const started = await echoStartsToday(context.userId, data.childId, now);
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
    const echoQueue = [...map.values()]
      .filter((row) => echoAvailable(row, now, started, p))
      .slice(0, Math.max(0, p.echo_per_day_cap - started));
    const seenToday = [...map.values()].filter(
      (row) => row.seenAt && utcDay(row.seenAt) === utcDay(now),
    ).length;
    const routeRow = await loadChildRoute(context.userId, data.childId);
    const ensured = await ensureChildPlan(context.userId, routeRow, map, now);
    const inspections = await loadInspections(context.userId, data.childId);
    const weekly = buildWeeklyPlan({
      route: ensured.route,
      plan: ensured.plan,
      progress: map,
      inspections,
      weeklyNewCap: routeRow.weeklyNewCap,
      nowIso: now,
    });
    const board =
      viewGrade === child.grade
        ? buildDepartureBoard({ progress: map, inspections, plan: weekly, nowIso: now })
        : null;
    const rings = buildGradeRings({ progress: map, profileGrade: child.grade });
    return {
      child,
      viewGrade,
      trains,
      total,
      perfect,
      echoQueue: viewGrade === child.grade ? echoQueue : [],
      seenToday,
      maxNew: p.max_new_per_day,
      peek: pickWeekPeek({ progress: map, grade: viewGrade }),
      board,
      rings,
    };
  });

export const getKanjiStudy = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { childId: string; char: string }) => input)
  .handler(async ({ context, data }) => {
    const { child, map } = await loadProgress(context.userId, data.childId);
    const now = new Date().toISOString();
    const p = paramsForChar(data.char, child.grade);
    const started = await echoStartsToday(context.userId, data.childId, now);
    const progress = map.get(data.char) ?? emptyProgress(data.char);
    const charGrade = (getKanji(data.char)?.grade ?? child.grade) as Grade;
    const rings = buildGradeRings({ progress: map, profileGrade: child.grade });
    return {
      child,
      progress,
      unlocked: true,
      echoOn: echoAvailable(progress, now, started, p),
      gradePerfect: rings.find((r) => r.grade === charGrade)?.perfect ?? 0,
    };
  });

export const completeEncounter = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { childId: string; char: string; sessionId: string }) => input)
  .handler(async ({ context, data }) => {
    const { child, progressMap } = await loadProgress(context.userId, data.childId);
    const params = toEngineGradeParams(paramsForChar(data.char, child.grade));
    const required = computeRequiredLamps(shapeSurfaceAvailable(data.char));
    const next = evaluateProgress(
      progressMap.get(data.char) ?? initialProgress(data.char),
      { type: "encounter", at: toHours(Date.now()), sessionId: data.sessionId },
      params,
      required,
    );
    await saveProgress(context.userId, data.childId, next);
    return { progress: toLegacyProgressState(next, params) };
  });

export const completeUnderstand = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { childId: string; char: string; sessionId: string }) => input)
  .handler(async ({ context, data }) => {
    const { child, progressMap } = await loadProgress(context.userId, data.childId);
    const params = toEngineGradeParams(paramsForChar(data.char, child.grade));
    const required = computeRequiredLamps(shapeSurfaceAvailable(data.char));
    const next = evaluateProgress(
      progressMap.get(data.char) ?? initialProgress(data.char),
      { type: "understand", at: toHours(Date.now()), sessionId: data.sessionId },
      params,
      required,
    );
    await saveProgress(context.userId, data.childId, next);
    return { progress: toLegacyProgressState(next, params) };
  });

/**
 * Guest -> account migration (entrance-page.md §6's "つづきから のれます"
 * promise). `records` are already `CharacterProgress` — converted
 * client-side from the old demo engine's ProgressState by
 * lib/guest-import.ts, and pre-filtered there to characters the guest
 * actually touched (never the seeded demo fixture). Each character merges
 * against whatever the new child already has — trivially nothing, for the
 * one caller this has today, but the merge is real: the higher status wins,
 * a tie keeps the earlier almostAt, so a re-import (or a future path that
 * isn't a brand-new child) can't reset an echo clock or demote real
 * progress. This is a write path with no engine event behind it — it does
 * not go through evaluateProgress, because there is no event: it is a
 * one-time transcription of state that already existed, not something that
 * happened just now.
 */
export const importGuestProgress = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { childId: string; records: CharacterProgress[] }) => input)
  .handler(async ({ context, data }) => {
    const { progressMap } = await loadProgress(context.userId, data.childId);
    for (const guestRecord of data.records) {
      const existing = progressMap.get(guestRecord.characterId) ?? initialProgress(guestRecord.characterId);
      const merged = mergeGuestProgress(existing, guestRecord);
      await saveProgress(context.userId, data.childId, merged);
    }
    return { imported: data.records.length };
  });

export const submitPractice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    childId: string;
    char: string;
    itemId: string;
    choiceId: string;
    isEcho: boolean;
    echoBatchDone: boolean;
    sessionId: string;
  }) => input)
  .handler(async ({ context, data }) => {
    const item = getItem(data.itemId, true);
    if (!item || item.kanji !== data.char) throw new Error("unknown item");
    const graded = gradeChoice(item, data.choiceId);

    const { child, map, progressMap } = await loadProgress(context.userId, data.childId);

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const params = toEngineGradeParams(paramsForChar(data.char, child.grade));
    const required = computeRequiredLamps(shapeSurfaceAvailable(data.char));
    const prev = progressMap.get(data.char) ?? initialProgress(data.char);
    const prevLegacy = map.get(data.char) ?? emptyProgress(data.char);
    const wantsEcho = data.isEcho && echoIsDue(prevLegacy, nowIso);
    const surfaceId = item.surfaceId ?? item.payload.surface?.id ?? `${item.kanji}:solo`;
    const soft = Boolean(item.payload.confusable || item.payload.phoneticFamily || item.payload.cloze);

    const attempt = (mode: "practice" | "echo"): CharacterProgress =>
      evaluateProgress(
        prev,
        {
          type: "answer",
          at: toHours(now),
          sessionId: data.sessionId,
          itemId: data.itemId,
          lamp: item.kind,
          correct: graded.correct,
          mode,
          surfaceId,
          soft,
        },
        params,
        required,
      );

    let scoringEcho = wantsEcho;
    let next: CharacterProgress;
    try {
      next = attempt(wantsEcho ? "echo" : "practice");
    } catch (err) {
      if (!(err instanceof EchoRejectedError) || !wantsEcho) throw err;
      // The engine's own eligibility check (MR-5) is the authority, not the
      // app's echoIsDue guess above — a rejection here means that guess was
      // stale (e.g. a second tab already spent the echo, or the scheduler
      // drifted). The child never sees this — practice-mode scoring below is
      // silent — but the event must land somewhere queryable: echo_rejections
      // is the table to check if echoes look off after launch.
      await recordEchoRejection({
        userId: context.userId,
        childId: data.childId,
        kanji: data.char,
        sessionId: data.sessionId,
        clause: err.clause,
        message: err.message,
        almostAt: timestampFromHours(prev.almostAt),
        attemptedAt: new Date(now),
        eligibleAtIso: prevLegacy.echoDueAt,
      });
      scoringEcho = false;
      next = attempt("practice");
    }

    await saveProgress(context.userId, data.childId, next);
    const nextLegacy = toLegacyProgressState(next, params);
    await awardStamp(context.userId, data.childId, prevLegacy, nextLegacy);
    await maybeRecordInspection({
      userId: context.userId,
      childId: data.childId,
      kanji: data.char,
      prev: prevLegacy,
      next: nextLegacy,
      nowIso,
    });

    const sql = await getSql();
    await sql`
      insert into practice_events (
        user_id, child_id, kanji, kind, correct, prompt, answer, item_id, is_echo, session_id
      )
      values (
        ${context.userId}, ${data.childId}, ${data.char}, ${item.kind}, ${graded.correct},
        ${item.payload.prompt}, ${graded.label}, ${data.itemId}, ${scoringEcho}, ${data.sessionId}
      )
    `;

    return {
      correct: graded.correct,
      label: graded.label,
      progress: nextLegacy,
      gradePerfect: buildGradeRings({
        progress: (() => {
          const nextMap = new Map(map);
          nextMap.set(data.char, nextLegacy);
          return nextMap;
        })(),
        profileGrade: child.grade,
      }).find((r) => r.grade === (getKanji(data.char)?.grade ?? child.grade))?.perfect ?? 0,
    };
  });

export const listMistakes = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((childId: string) => childId)
  .handler(async ({ context, data: childId }) => {
    const sql = await getSql();
    const rows = await sql<{
      kanji: string;
      kind: string;
      answer: string;
      created_at: string | Date;
    }>`
      select kanji, kind, answer, created_at
      from practice_events
      where user_id = ${context.userId} and child_id = ${childId} and correct = false
      order by created_at desc
      limit 40
    `;
    return rows.map((r) => ({
      kanji: r.kanji,
      kind: r.kind,
      answer: r.answer,
      created_at: iso(r.created_at) ?? "",
    }));
  });

export const getParentOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((childId: string) => childId)
  .handler(async ({ context, data: childId }) => {
    const { child, map } = await loadProgress(context.userId, childId);
    const trains = decorateTrains(child.grade, map);
    const counts: Record<MasteryStatus, number> = {
      new: 0,
      lost: 0,
      fix: 0,
      almost: 0,
      perfect: 0,
    };
    let total = 0;
    for (const t of trains) {
      for (const car of t.cars) {
        total += 1;
        counts[car.status] += 1;
      }
    }
    const sql = await getSql();
    const recent = await sql<{
      kanji: string;
      kind: string;
      correct: boolean;
      created_at: string | Date;
      is_echo: boolean;
      session_id: string;
      answer: string;
    }>`
      select kanji, kind, correct, created_at, is_echo, session_id, answer
      from practice_events
      where user_id = ${context.userId} and child_id = ${childId}
      order by created_at desc
      limit 200
    `;
    const events: ReportEvent[] = recent.map((ev) => ({
      kanji: ev.kanji,
      kind: ev.kind,
      correct: asBool(ev.correct),
      created_at: iso(ev.created_at) ?? "",
      is_echo: asBool(ev.is_echo),
      session_id: String(ev.session_id ?? ""),
      answer: String(ev.answer ?? ""),
    }));
    const stamps = await listStamps(context.userId, childId);
    const report = buildParentReport({
      grade: child.grade,
      progress: map,
      events,
      stamps,
    });
    const nowIso = new Date().toISOString();
    const routeRow = await loadChildRoute(context.userId, childId);
    const ensured = await ensureChildPlan(context.userId, routeRow, map, nowIso);
    const inspections = await loadInspections(context.userId, childId);
    const weekly = buildWeeklyPlan({
      route: ensured.route,
      plan: ensured.plan,
      progress: map,
      inspections,
      weeklyNewCap: routeRow.weeklyNewCap,
      nowIso,
    });
    const forward = buildForwardMetrics({
      route: ensured.route,
      plan: weekly,
      progress: map,
      events,
      inspections,
      nowIso,
    });
    const arrival = buildProjectedArrival({
      route: ensured.route,
      progress: map,
      events,
      nowIso,
      weeklyNewCap: routeRow.weeklyNewCap,
    });
    const allRoutes = await listChildRoutes(context.userId, childId);
    const history = allRoutes.filter((r) => r.id !== ensured.route.id);
    return {
      child: { ...child, startBand: routeRow.startBand },
      trains,
      counts: report.counts,
      total,
      perfect: counts.perfect,
      started: map.size,
      recent: events.slice(0, 12),
      stamps,
      stampCount: stamps.length,
      lines: report.lines.map((line) => ({
        id: line.id,
        label: line.label,
        type: line.type,
        done: line.perfect,
        total: line.total,
      })),
      report,
      route: ensured.route,
      plan: weekly,
      forward,
      progress: Object.fromEntries(map),
      history,
      arrival,
      canRollover: canAdvanceGrade(child.grade),
      aprilPrompt: shouldShowAprilPrompt({
        grade: child.grade,
        nowIso,
        dismissedSy: routeRow.rolloverDismissedSy,
      }),
    };
  });

export const getMapState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { childId: string; grade?: number }) => input)
  .handler(async ({ context, data }) => {
    const { child, map } = await loadProgress(context.userId, data.childId);
    const now = new Date().toISOString();
    const viewGrade = parseGrade(data.grade) ?? child.grade;
    const lines = mapLinesFor(viewGrade).map((view) => ({
      ...view,
      stations: view.stations.map((station) => ({
        ...station,
        status: map.get(station.kanji)?.status ?? "new",
        echoDue: echoIsDue(map.get(station.kanji) ?? emptyProgress(station.kanji), now),
        echoDueAt: (map.get(station.kanji) ?? emptyProgress(station.kanji)).echoDueAt,
      })),
    }));
    return { child, viewGrade, lines };
  });

export const getStampBook = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((childId: string) => childId)
  .handler(async ({ context, data: childId }) => {
    const { child } = await loadProgress(context.userId, childId);
    const stamps = await listStamps(context.userId, childId);
    return { child, stamps };
  });
