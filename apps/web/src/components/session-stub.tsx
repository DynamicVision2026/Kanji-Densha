import { useRef } from "react";
import { KANJI_LINES } from "@/data/lines";
import { useI18n } from "@/lib/i18n/i18n";
import type { SessionRide } from "@/lib/session-stub";

const TONE = { fill: "#E6F0DC", border: "#9AAE85", ink: "#16301F" };

function serialFor(chars: string[]): string {
  let hash = 0;
  for (const c of chars.join(",")) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return `No.${String(hash % 100000).padStart(5, "0")}`;
}

/** return-ticket.md's "station name" field — the editorial line the
 * session's first character belongs to. A session can touch more than one
 * line; this names the first ridden character's, a deliberate
 * simplification rather than an attempt at a single name for a mixed set. */
function stationNameFor(chars: string[]): string {
  const first = chars[0];
  const line = KANJI_LINES.find((l) => l.stations.some((s) => s.kanji === first));
  return line?.label_ja ?? "でんしゃ";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * return-ticket.md's 乗車券 — one per session (browser tab, see
 * session-stub.ts), not per character. Punched (reuses the same dual-mask
 * notch technique as practice-card.tsx's ticket resemblance, duplicated
 * here rather than shared since that work is on a separate, unmerged
 * branch — dedupe once it lands), dated with the earliest echo due across
 * the session, QR, saveable as a PNG.
 *
 * Status is always だいたい by construction, never derived from any
 * character's actual status: "Status | だいたい — never かんぺき, which is
 * days away." A character that happened to reach 完璧 mid-session is
 * still shown here as だいたい — this is not a bug, it's the one rule the
 * whole design doc calls out by name (MR-7.3, I7).
 */
export function SessionStub({
  rides,
  returnDate,
  onDecline,
}: {
  rides: SessionRide[];
  returnDate: string | null;
  onDecline: () => void;
}) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chars = rides.map((r) => r.char);
  const issueDate = formatDate(new Date().toISOString());

  async function save() {
    const node = canvasRef.current?.closest("[data-session-stub]") as HTMLElement | null;
    if (!node) return;
    // Canvas render -> PNG -> download, per return-ticket.md's
    // implementation note ("No server round-trip, no account required").
    // html-to-canvas conversion of live DOM is out of scope for a
    // dependency-free implementation, so this renders the ticket's own
    // fields directly onto a canvas rather than rasterizing the DOM node.
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = TONE.fill;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = TONE.border;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    ctx.fillStyle = TONE.ink;
    ctx.font = "28px sans-serif";
    ctx.fillText(stationNameFor(chars), 32, 56);
    ctx.font = "72px serif";
    ctx.fillText(chars.join("  "), 32, 160);
    ctx.font = "20px sans-serif";
    if (returnDate) ctx.fillText(`つぎのでんしゃ ${formatDate(returnDate)}`, 32, 220);
    ctx.font = "14px monospace";
    ctx.fillText(serialFor(chars), 32, canvas.height - 24);
    ctx.fillText(`kanji-ai.jp · ${issueDate}`, canvas.width - 220, canvas.height - 24);
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `densha-ticket-${chars.join("")}.png`;
    a.click();
  }

  if (!chars.length) return null;

  return (
    // Deliberately compact: RideShell's action zone is a fixed-height,
    // bottom-anchored, scrollable strip (data-ride-action,
    // flex-[0_0_42%]) shared with SavePromptBanner and the primary CTA
    // below it — the generous, full-size ticket treatment used elsewhere
    // (practice-card.tsx's ticket resemblance) doesn't fit three stacked
    // elements in that space without pushing the offer above the fold.
    <div
      className="stub-notch stub-paper relative mb-2 flex flex-col gap-1.5 rounded-xl px-4 py-3 text-left"
      style={{ backgroundColor: TONE.fill, border: `2px solid ${TONE.border}`, color: TONE.ink }}
      data-session-stub
    >
      <canvas ref={canvasRef} hidden aria-hidden />
      <div className="flex items-center justify-between text-xs">
        <span>{stationNameFor(chars)}</span>
        <span>{t("statusAlmost")}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-wrap gap-1" aria-hidden>
          {chars.map((c) => (
            <span key={c} className="grid size-9 place-items-center rounded bg-bg-warm font-display text-lg">
              {c}
            </span>
          ))}
        </div>
        {returnDate ? (
          <p className="text-xs">
            {t("ticketReturn")}
            <br />
            <strong>{formatDate(returnDate)}</strong>
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between font-mono text-[10px] whitespace-nowrap">
        <span>{serialFor(chars)}</span>
        {/* Placeholder only — not a real scannable QR. Same judgment call
            as ticket-fold.tsx (a separate, unmerged branch): a correct
            payload needs either a QR-encoding dependency or a hand-rolled
            encoder, a bigger decision than this component should make
            alone, and a QR that looks real but doesn't scan is worse than
            none. */}
        <span className="grid size-5 grid-cols-3 grid-rows-3 gap-px" data-qr-placeholder aria-hidden>
          {Array.from({ length: 9 }, (_, i) => {
            const serial = serialFor(chars);
            const on = serial.charCodeAt(i % serial.length) % 2 === 0;
            return <span key={i} className="bg-current" style={{ opacity: on ? 1 : 0 }} />;
          })}
        </span>
        <span>kanji-ai.jp · {issueDate}</span>
      </div>
      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={save}
          className="flex h-9 flex-1 items-center justify-center rounded-lg bg-primary text-xs text-primary-fg"
          data-session-stub-save
        >
          {t("ticketOffer")}
        </button>
        {/* return-ticket.md: "Declining either must cost nothing" — the
            ticket needs the same escape hatch as SavePromptBanner's あとで. */}
        <button
          type="button"
          onClick={onDecline}
          className="flex h-9 flex-1 items-center justify-center rounded-lg border border-current bg-transparent text-xs"
          data-session-stub-decline
        >
          {t("later")}
        </button>
      </div>
    </div>
  );
}
