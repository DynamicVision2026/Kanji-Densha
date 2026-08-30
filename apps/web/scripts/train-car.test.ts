import assert from "node:assert/strict";
import { test } from "node:test";
import { toTrainCar } from "../src/lib/train-car.ts";

test("main-line membership keys off stampedAt, never current status (D20)", () => {
  const stamped = toTrainCar({ char: "王", status: "fix", stampedAt: "2026-01-01T00:00:00.000Z" });
  assert.equal(stamped.onMainLine, true, "a regressed かんぺき character keeps its main-line car");

  const almostNotStamped = toTrainCar({ char: "右", status: "almost", stampedAt: null });
  assert.equal(almostNotStamped.onMainLine, false);

  const perfectNotYetStamped = toTrainCar({ char: "花", status: "perfect", stampedAt: null });
  assert.equal(
    perfectNotYetStamped.onMainLine,
    false,
    "status alone never grants the main line — only a real stamp does",
  );
});

test("echoDue passes through unchanged", () => {
  const car = toTrainCar({ char: "右", status: "almost", stampedAt: null, echoDue: true });
  assert.equal(car.echoDue, true);
});
