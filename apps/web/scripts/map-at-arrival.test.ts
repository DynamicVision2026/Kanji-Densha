import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// train-overview.ts's intent helpers read/write `window.sessionStorage`,
// guarded by `typeof window === "undefined"` for SSR — this plain node
// test file has no DOM, so a minimal stand-in is enough to exercise them.
(globalThis as { window?: unknown }).window = {
  sessionStorage: (() => {
    const store = new Map<string, string>();
    return {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    };
  })(),
};

const { clearMapIntent, readOverviewIntent, writeOverviewIntent } = await import(
  "../src/lib/train-overview.ts"
);

// child-home-and-sessions.md §1 amendment (post-PR-#23 review): the child
// home has exactly one control, but the map cannot simply disappear — a
// child's route, editorial lines, and 未開通 stations are most of the
// built world. It opens from 到着 instead: WelcomeOverview's own map
// button (reachable after "seeTrain"), and a direct "see the map" link on
// the couple-beat screen itself, alongside the existing "seeTrain"/"next"
// choice.
test("map intent round-trips through the same storage as the overview intent", () => {
  writeOverviewIntent({ map: true, glow: ["一"] });
  const read = readOverviewIntent();
  assert.equal(read?.map, true);
  assert.deepEqual(read?.glow, ["一"]);
  clearMapIntent();
  assert.equal(readOverviewIntent()?.map, false);
});

test("couple-beat offers a direct map link, alongside seeTrain/next", () => {
  const session = readFileSync("src/components/kanji-session.tsx", "utf8");
  assert.match(session, /data-see-map/);
  assert.match(session, /writeOverviewIntent\(\{ map: true/);
  const seeTrainIdx = session.indexOf("data-see-train");
  const nextIdx = session.indexOf("data-couple-next");
  const mapIdx = session.indexOf("data-see-map");
  assert.ok(seeTrainIdx >= 0 && nextIdx > seeTrainIdx && mapIdx > nextIdx);
});

test("WelcomeOverview exposes its own map button, and child-home wires it to MapOverlay", () => {
  const overview = readFileSync("src/components/welcome-overview.tsx", "utf8");
  const home = readFileSync("src/components/child-home.tsx", "utf8");
  assert.match(overview, /onOpenMap/);
  assert.match(home, /onOpenMap=\{\(\) => setMapOpen\(true\)\}/);
  assert.match(home, /intent\.map/);
  assert.match(home, /<MapOverlay/);
});
