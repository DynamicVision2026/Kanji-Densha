import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CAR_GAP,
  FIRST_CLIMB_D,
  SWITCHBACK_PATH,
  TRAIN_SPEED,
  firstClimbDistance,
  openingHead,
  poseAt,
  sampleLut,
  wrapHead,
  type CarPose,
} from "@/lib/welcome-switchback";

// entrance-page.md §4: the scene is decorative and generic, driven by a
// static fixture — never progress (I5: nothing here reads or derives a
// mastery status). Grade 1's first train is 一右雨円王; four cars is enough
// to read the idea without a fifth crowding a small panel.
const DEMO_CARS = ["一", "右", "雨", "円"] as const;

// Demo styling — one step paler than an earned car (M5 home), dashed border.
// "The dashed border means one thing across the entire product: not yet
// real." Never colour alone: dashing survives greyscale and colour-blindness.
const DEMO_BODY_FILL = "#CBD9BC";
const DEMO_BORDER = "#8FA97A";
const DEMO_INK = "#3C5233";

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function posed(pose: CarPose) {
  if (pose.hidden) return { opacity: "0", transform: `translate(${pose.x} ${pose.y})` };
  return {
    opacity: String(pose.opacity),
    transform: `translate(${pose.x.toFixed(1)} ${pose.y.toFixed(1)}) scale(${pose.scale.toFixed(3)})`,
  };
}

function DemoCar({ char }: { char: string }) {
  return (
    <g data-entrance-demo-car={char}>
      <rect
        x="-26"
        y="-45"
        width="52"
        height="45"
        rx="8"
        fill={DEMO_BODY_FILL}
        stroke={DEMO_BORDER}
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />
      <circle cx="-12" cy="1" r="4" fill={DEMO_INK} opacity="0.6" />
      <circle cx="12" cy="1" r="4" fill={DEMO_INK} opacity="0.6" />
      <text textAnchor="middle" y="-18" fontSize="28" fontFamily="var(--font-display)" fill={DEMO_INK}>
        {char}
      </text>
      {/* No stamp dot, ever — dashed demo cars never carry the かんぺき signal. */}
    </g>
  );
}

function DemoEngine() {
  return (
    <g data-entrance-demo-engine>
      <rect x="-26" y="-45" width="52" height="45" rx="8" fill={DEMO_BODY_FILL} stroke={DEMO_BORDER} strokeWidth="1.2" strokeDasharray="4 3" />
      <rect x="4" y="-59" width="12" height="14" rx="2" fill={DEMO_BODY_FILL} stroke={DEMO_BORDER} strokeWidth="1.2" strokeDasharray="4 3" />
      <circle cx="-14" cy="-22" r="6" fill="var(--color-bg)" />
      <circle cx="-12" cy="1" r="4" fill={DEMO_INK} opacity="0.6" />
      <circle cx="12" cy="1" r="4" fill={DEMO_INK} opacity="0.6" />
    </g>
  );
}

/**
 * Positions for reduced motion: engine + cars spread evenly across the whole
 * route, nearest (newest) first — not bunched at the near terrace. Same
 * ordering as the moving train (welcome-screen.md §2), just not coupled at
 * CAR_GAP: "distributed across the whole route and visible", not a frozen
 * frame of a train that would mostly be off the small entrance panel.
 */
function distributedPositions(carCount: number, length: number): number[] {
  const total = carCount + 1; // + engine
  if (total <= 1 || length <= 0) return [length];
  const usable = Math.max(0, length - 80);
  const ascending = Array.from({ length: total }, (_, i) => 40 + (usable * i) / (total - 1));
  return ascending.reverse(); // engine (index 0 below) gets the farthest/highest point
}

export function EntranceScene() {
  const pathRef = useRef<SVGPathElement>(null);
  const [lut, setLut] = useState<[number, number][]>([]);
  const [length, setLength] = useState(0);
  const [head, setHead] = useState(0);
  const headRef = useRef(0);
  const climbRef = useRef(FIRST_CLIMB_D);
  const [reduced, setReduced] = useState(prefersReducedMotion);

  // getPointAtLength runs here, once, at mount — never in the frame loop
  // (entrance-page.md §4 / welcome-screen.md §1). openingHead places the
  // opening frame with the tail already on-canvas (same placement M5's home
  // uses) — a naive "somewhere near the start" head leaves the demo cars
  // hidden (d < 0) until the RAF loop has run long enough to catch up.
  useLayoutEffect(() => {
    const node = pathRef.current;
    if (!node) return;
    const L = node.getTotalLength();
    const sampled = sampleLut((d) => node.getPointAtLength(d), L);
    const climb = firstClimbDistance(sampled);
    setLut(sampled);
    setLength(L);
    climbRef.current = climb;
    const start = openingHead(DEMO_CARS.length, L, climb);
    headRef.current = start;
    setHead(start);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced || length <= 0) return;
    let last = performance.now();
    let raf = 0;
    const units = DEMO_CARS.length + 1;
    const tick = (ts: number) => {
      const dt = Math.min(0.05, (ts - last) / 1000 || 0);
      last = ts;
      const next = wrapHead(headRef.current + TRAIN_SPEED * dt, units, length, climbRef.current);
      headRef.current = next;
      setHead(next);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [reduced, length]);

  const distributed = reduced ? distributedPositions(DEMO_CARS.length, length) : null;
  const enginePose = distributed
    ? poseAt(distributed[0]!, lut, length)
    : poseAt(head, lut, length);
  const carPoses = DEMO_CARS.map((_, i) =>
    distributed ? poseAt(distributed[i + 1]!, lut, length) : poseAt(head - (i + 1) * CAR_GAP, lut, length),
  );

  return (
    <div className="relative h-full w-full overflow-hidden" data-entrance-scene>
      <svg
        viewBox="-100 150 560 280"
        preserveAspectRatio="xMidYMax meet"
        className="h-full w-full"
        role="img"
        aria-label="学んだ漢字が一両ずつ列車になる様子"
      >
        <path
          d={SWITCHBACK_PATH}
          fill="none"
          stroke="var(--color-fg)"
          strokeWidth="8"
          strokeDasharray="2 9"
          opacity="0.18"
        />
        <path ref={pathRef} d={SWITCHBACK_PATH} fill="none" stroke="var(--color-border)" strokeWidth="5" strokeLinecap="round" />

        <g {...posed(enginePose)}>
          <DemoEngine />
        </g>
        {DEMO_CARS.map((char, i) => (
          <g key={char} {...posed(carPoses[i] ?? { x: 0, y: 0, scale: 1, opacity: 0, hidden: true })}>
            <DemoCar char={char} />
          </g>
        ))}
      </svg>
    </div>
  );
}
