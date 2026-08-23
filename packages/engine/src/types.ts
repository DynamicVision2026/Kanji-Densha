// Domain types for the mastery state machine.
//
// These live here and nowhere else (CLAUDE.md §5: nothing re-declares Status or
// Lamp). Shapes follow architecture.md §1.1–§1.3 and mastery-rules.md §1, with
// the two authority changes from decisions.md carried in the events (§1.2):
// there is no `novelSurface` flag (novelty is derived — MR-1.2) and no
// `echo_result` event (the engine owns echo rounds — MR-1.3).

export type Lamp = 'reading' | 'meaning' | 'shape';
export type Status = 'new' | 'lost' | 'fix' | 'almost' | 'perfect';
export type Grade = 1 | 2 | 3 | 4 | 5 | 6;

export interface EchoAttempt {
  readonly at: number;
  readonly ok: boolean;
  readonly sessionId: string;
}

export interface OpenEcho {
  readonly startedAt: number;
  readonly sessionId: string;
  readonly results: Readonly<Partial<Record<Lamp, boolean>>>;
}

export interface CharacterProgress {
  readonly characterId: string; // NFC — normalised at the schema boundary, not here
  readonly status: Status; // derived only (MR-1.1)
  readonly lamps: Readonly<Record<Lamp, boolean>>;
  readonly encountered: boolean;
  readonly understood: boolean;
  readonly repairs: readonly Lamp[];
  readonly lostFlag: boolean;
  readonly consecutiveWrong: Readonly<Record<Lamp, number>>;
  readonly lifetimeWrong: Readonly<Record<Lamp, number>>;
  readonly almostAt: number | null;
  readonly almostSessionId: string | null;
  readonly echoes: readonly EchoAttempt[];
  readonly openEcho: OpenEcho | null; // engine-owned echo round (MR-1.3)
  readonly seenSurfaces: readonly string[];
  readonly novelFailures: readonly string[]; // surfaces that spent the U2 exemption (MR-4.3)
  readonly stampedAt: number | null;
}

export type ProgressEvent =
  | { readonly type: 'encounter'; readonly at: number; readonly sessionId: string }
  | { readonly type: 'understand'; readonly at: number; readonly sessionId: string }
  | {
      readonly type: 'answer';
      readonly at: number;
      readonly sessionId: string;
      readonly itemId: string;
      readonly lamp: Lamp; // exactly one — I1
      readonly correct: boolean;
      readonly mode: 'practice' | 'echo';
      readonly surfaceId: string | null;
      readonly soft: boolean; // 似た駅名 etc: repairs, never lights, never counts toward lost
    };

export interface GradeParams {
  readonly grade: Grade;
  readonly sessionItemCap: number;
  readonly itemsPerLamp: number;
  readonly echoFirstDelayHours: number;
  readonly echoSecondDelayHours: number;
  readonly echoPerDayCap: number;
  readonly lostConsecutiveWrong: number;
  readonly lostLifetimeWrong: number;
  readonly forceReteachOnWrong: boolean;
}

/** The three lamps, in canonical order. */
export const LAMPS: readonly Lamp[] = ['reading', 'meaning', 'shape'];
