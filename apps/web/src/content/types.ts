// The shape apps/web reads from content-dist/g{grade}.json (architecture §2.2,
// M2's build.ts). Mirrors the authored + generated fields exactly; this file
// declares no new content facts, only the wire shape already emitted.
import type { Lamp } from '@kanji-densha/engine';

export interface TaughtReading {
  readonly id: string;
  readonly kana: string;
  readonly type: 'on' | 'kun';
  readonly audio: string;
}

export interface Surface {
  readonly id: string;
  readonly word: string;
  readonly reading_id: string;
  readonly audio: string;
}

export interface ReadingChoiceItem {
  readonly id: string;
  readonly type: 'reading_choice';
  readonly lamp: 'reading';
  readonly reading_id: string;
  readonly choices: readonly { kana: string; correct: boolean }[];
}

export interface MeaningChoiceItem {
  readonly id: string;
  readonly type: 'meaning_choice';
  readonly lamp: 'meaning';
  readonly choices: readonly { gloss_ja: string; semantic: true; correct: boolean }[];
}

export interface StrokeOrderItem {
  readonly id: string;
  readonly type: 'stroke_order';
  readonly lamp: 'shape';
}

export type Item = ReadingChoiceItem | MeaningChoiceItem | StrokeOrderItem | { readonly id: string; readonly type: string; readonly lamp: Lamp };

export type Shape =
  | { readonly published: false }
  | {
      readonly published: true;
      readonly kind: 'primitive';
      readonly strokes: readonly { order: number; type: string; a11y_ja: string }[];
    }
  | { readonly published: true; readonly kind: 'compound'; readonly components: readonly { char: string; role?: string }[] };

export interface CharacterBundle {
  readonly character: string;
  readonly grade: number;
  readonly taught_readings: { readonly entries: readonly TaughtReading[]; readonly rationale: string; readonly anchor: string };
  readonly meaning: { readonly gloss_ja: string; readonly category: string };
  readonly encounter: { readonly art: string | null; readonly template: string | null; readonly copy_ja: string };
  readonly surfaces: readonly Surface[];
  readonly shape: Shape;
  readonly items: readonly Item[];
  readonly lines: readonly string[];
  readonly elementary_readings: readonly { kana: string; type: string }[];
  readonly later_readings: readonly { kana: string; type: string }[];
  readonly teach_ready: boolean;
  readonly audio_pending: readonly { item: string; satisfied_by: readonly string[] }[];
}

export interface Manifest {
  readonly content_hash: string;
  readonly grades: Record<string, unknown>;
  readonly audio_manifest: readonly string[];
  readonly pending: Record<string, unknown>;
}
