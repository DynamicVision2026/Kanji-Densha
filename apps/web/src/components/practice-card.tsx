import type { ReactNode } from "react";
import type { MasteryStatus, PracticeKind } from "@/lib/mastery";

// practice-card-states.md §1 — the engine's five statuses map one-to-one, no
// collapsing, no invented sixth state. かんぺき can never appear during a
// session (MR-7.3, I7): the engine itself cannot derive `perfect` from a
// single sitting (two spaced echoes, ~20h and ~168h apart, are required), so
// nothing here needs to re-check that — it would have nothing to check
// against. This component only renders whatever status it is given.
const CARD: Record<
  MasteryStatus,
  { fill: string; border: string; ink: string; ctaLabel: string; ctaIcon: (props: { size: number }) => ReactNode; stamp?: boolean }
> = {
  new: { fill: "transparent", border: "#B9B2A0", ink: "#2C2A24", ctaLabel: "はじめる", ctaIcon: PlayIcon },
  fix: { fill: "#FBF2E2", border: "#D9A441", ink: "#2C2A24", ctaLabel: "もういちど", ctaIcon: RedoIcon },
  lost: { fill: "#F0EDE6", border: "#A79F8D", ink: "#2C2A24", ctaLabel: "もういちど みる", ctaIcon: EyeIcon },
  almost: { fill: "#E6F0DC", border: "#9AAE85", ink: "#16301F", ctaLabel: "つぎへ", ctaIcon: ArrowIcon },
  perfect: {
    fill: "#7E9C68",
    border: "#6A8757",
    ink: "#F4F1E6",
    ctaLabel: "でんしゃを みる",
    ctaIcon: TrainIcon,
    stamp: true,
  },
};

const DASHED_BORDER = "new" satisfies MasteryStatus; // the product-wide "not yet real" border (§1)
const VERMILION = "#B4432F";

/**
 * practice-card-states.md §5 — "a small monospace serial in a corner",
 * family resemblance to the ticket rather than data: deterministic from
 * character + status only, so it's stable across renders (no hydration
 * mismatch) and needs no server round-trip, consistent with the ticket
 * system's own no-server-round-trip rule (return-ticket.md).
 */
function serialFor(char: string, status: MasteryStatus): string {
  const input = `${char}:${status}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return `No.${String(hash % 100000).padStart(5, "0")}`;
}

// Plain monochrome SVGs, not emoji: an emoji glyph is pre-coloured by the
// font and ignores `color`, so "icon in #FFF9F0" (lit) / "#B9B2A0" (hollow)
// from §2 has no effect on one — currentColor is the only way both lamp
// states and the white-on-vermilion CTA actually land the colour the spec
// calls for, consistently across platforms.
function VolumeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 9v6h4l5 4V5L8 9H4z" strokeLinejoin="round" fill="currentColor" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" strokeLinecap="round" />
      <path d="M19 6a9 9 0 0 1 0 12" strokeLinecap="round" />
    </svg>
  );
}
function BulbIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18h6M10 21h4" strokeLinecap="round" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.15 1 1.9v.2h5v-.2c0-.75.4-1.45 1-1.9A6 6 0 0 0 12 3Z" />
    </svg>
  );
}
function PencilIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20l1-4L16 5l3 3L8 19l-4 1Z" strokeLinejoin="round" />
      <path d="M14 7l3 3" />
    </svg>
  );
}
function PlayIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 4v16l14-8z" />
    </svg>
  );
}
function RedoIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12a8 8 0 1 1 3 6.2" strokeLinecap="round" />
      <path d="M4 17v-5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function EyeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
function ArrowIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12h15M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrainIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="4" width="14" height="12" rx="3" />
      <path d="M5 12h14M8 16l-2 4M16 16l2 4" strokeLinecap="round" />
      <circle cx="9" cy="9" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const LAMP_ORDER: readonly PracticeKind[] = ["reading", "meaning", "shape"];
const LAMP_ICON: Record<PracticeKind, (props: { size: number }) => ReactNode> = {
  reading: VolumeIcon,
  meaning: BulbIcon,
  shape: PencilIcon,
};
const LAMP_KANA: Record<PracticeKind, string> = { reading: "よみ", meaning: "いみ", shape: "かたち" };

function Lamp({
  kind,
  lit,
  tone,
  kanaColor,
}: {
  kind: PracticeKind;
  lit: boolean;
  tone: string;
  kanaColor: string;
}) {
  const Icon = LAMP_ICON[kind];
  return (
    <div className="flex flex-col items-center gap-1" data-lamp={kind} data-lit={lit || undefined}>
      <div
        className="grid size-10 min-h-8 min-w-8 place-items-center rounded-full border-2"
        style={
          lit
            ? { backgroundColor: tone, borderColor: tone, color: "#FFF9F0" }
            : { backgroundColor: "transparent", borderColor: "#B9B2A0", color: "#B9B2A0" }
        }
      >
        <Icon size={18} />
      </div>
      {/* Card `ink`, not a fixed text-fg-subtle class: the かんぺき card's
          dark green fill needs a light label, every other card needs a
          dark one, and ink is already the correct contrast choice per
          state since it's what the kanji itself uses. */}
      <span className="text-[10px] opacity-70" style={{ color: kanaColor }}>
        {LAMP_KANA[kind]}
      </span>
    </div>
  );
}

/**
 * The child-facing practice card (practice-card-states.md, design authority).
 * `status` and `lamps` come straight from progress — reading, never
 * re-deriving (I5). `fix`'s "lit except the one needing repair" and `lost`'s
 * "all hollow" both fall out of passing the real per-lamp state through
 * unchanged; this component makes no state-specific lamp decisions.
 */
export function PracticeCard({
  char,
  status,
  lamps,
  onPrimaryAction,
  className,
}: {
  char: string;
  status: MasteryStatus;
  lamps: Record<PracticeKind, boolean>;
  onPrimaryAction: () => void;
  className?: string;
}) {
  const tone = CARD[status];
  const dashed = status === DASHED_BORDER;
  const CtaIcon = tone.ctaIcon;

  return (
    <div
      className={`ticket-notch ticket-paper flex flex-col items-center gap-4 rounded-xl p-4 ${className ?? ""}`}
      style={{
        backgroundColor: tone.fill,
        border: `2px ${dashed ? "dashed" : "solid"} ${tone.border}`,
      }}
      data-practice-card
      data-status={status}
    >
      <span
        className="pointer-events-none absolute left-3 top-2 font-mono text-[9px] tracking-wide whitespace-nowrap"
        style={{ color: tone.ink, opacity: 0.45 }}
        data-serial
      >
        {serialFor(char, status)}
      </span>

      <div className="relative">
        <p
          className="font-display text-[76px] leading-none md:text-[88px]"
          style={{ color: tone.ink }}
        >
          {char}
        </p>
        {tone.stamp ? (
          <span
            className="absolute -right-3 -top-2 grid size-8 place-items-center rounded-full text-sm"
            style={{ backgroundColor: "#D9A441", color: "#FFF9F0" }}
            aria-label="かんぺきスタンプ"
            data-stamp
          >
            ●
          </span>
        ) : null}
      </div>

      <div className="flex gap-4">
        {LAMP_ORDER.map((kind) => (
          <Lamp key={kind} kind={kind} lit={lamps[kind]} tone={tone.border} kanaColor={tone.ink} />
        ))}
      </div>

      <button
        type="button"
        onClick={onPrimaryAction}
        className="flex h-16 w-full flex-col items-center justify-center gap-1 rounded-lg px-[18px] text-white"
        style={{ backgroundColor: VERMILION }}
      >
        <CtaIcon size={22} />
        <span className="text-sm">{tone.ctaLabel}</span>
      </button>
    </div>
  );
}
