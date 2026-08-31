// M3 exit criteria (docs/prompts/kickoff-m2-m3.md): one happy path through all
// four beats, a completed session lands at almost and never perfect however
// many items are answered correctly (I7), and an axe accessibility pass on
// each beat. Runs against a production build (see playwright.config.ts) —
// TanStack Start's dev server lazily compiles on first request, which is a
// real dev-mode characteristic, not something a CI suite should depend on.
//
// docs/reviews/remediation-plan.md R5: this spec tested LocalStore and a `/`
// 山 ride that no longer exist — `/` no longer renders a ride directly (it's
// the entrance door / guest home now, entrance-page.md §1), the hero
// character is 一, not 山, and guest progress lives at
// densha.demo.progress.v4 (demo-progress.ts), not the old
// kanji-densha:v1:progress:guest key. Rewritten against the route
// (/demo/kanji/一) and the app's own stable data-tour markers rather than
// hardcoded button copy, so it survives future copy changes the way the old
// version didn't survive this one. Driving is a generic tick loop (like a
// real child tapping whatever's next) rather than a fixed step sequence,
// because a wrong answer on a forceReteachOnWrong grade (G1) bounces back to
// わかる mid-ride (kanji-session.tsx's onNext) — a fixed sequence can't
// follow that branch.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const CHAR = '一';
const STORAGE_KEY = 'densha.demo.progress.v4';

async function readStoredProgress(page: import('@playwright/test').Page) {
  const raw = await page.evaluate((k) => window.localStorage.getItem(k), STORAGE_KEY);
  if (raw === null) return null;
  return (JSON.parse(raw) as Record<string, unknown>)[CHAR];
}

const ARRIVED = '[data-echo-arrival], [data-tour="feedback"]';

/**
 * Drives the ride forward one tick at a time until arrival (だいたい/perfect
 * feedback) or `maxTicks` is exhausted, clicking whatever's actionable in a
 * fixed priority order. `onDecoyOpportunity` is called once per tick when a
 * decoy choice is visible and no correct choice has been clicked yet this
 * item — returning true consumes the deliberate-wrong-answer opportunity
 * (used by the reteach test) and skips the normal correct-choice click that
 * tick.
 */
async function driveToArrival(
  page: import('@playwright/test').Page,
  options: { maxTicks?: number; onDecoyOpportunity?: () => boolean } = {},
) {
  const maxTicks = options.maxTicks ?? 60;
  for (let tick = 0; tick < maxTicks; tick += 1) {
    if (await page.locator(ARRIVED).first().count()) return;

    const dismiss = page.locator('[data-tour="announce-dismiss"]');
    if (await dismiss.count()) {
      await dismiss.first().click({ timeout: 800 }).catch(() => {});
    }
    const rideOn = page.locator('[data-tour="ride-on"]:not([disabled])');
    if (await rideOn.count()) {
      await rideOn.first().click({ timeout: 800 }).catch(() => {});
    }
    const tapReadings = page.locator('button[data-tour="tap-readings"]');
    if (await tapReadings.count()) {
      await tapReadings.first().click({ timeout: 800 }).catch(() => {});
    }
    const speaker = page.locator('button[data-tour="speaker"]');
    if (await speaker.count()) {
      await speaker.first().click({ timeout: 800 }).catch(() => {});
    }
    const readingsAck = page.locator('[data-tour="readings-ack"]');
    if (await readingsAck.count()) {
      await readingsAck.first().click({ timeout: 800 }).catch(() => {});
    }
    const placeScroll = page.locator('[data-tour="place-scroll"]');
    if (await placeScroll.count()) {
      await placeScroll.first().click({ timeout: 800 }).catch(() => {});
    }
    const understood = page.locator('[data-tour="understood"]:not([disabled])');
    if (await understood.count()) {
      await understood.first().click({ timeout: 800 }).catch(() => {});
    }
    const decoy = page.locator('button[data-tour="choice-decoy"]');
    let tookDecoy = false;
    if (options.onDecoyOpportunity && (await decoy.count())) {
      tookDecoy = options.onDecoyOpportunity();
      if (tookDecoy) await decoy.first().click({ timeout: 800 }).catch(() => {});
    }
    if (!tookDecoy) {
      const strokeNext = page.locator('button[data-tour="stroke-next"]');
      const correct = page.locator('button[data-tour="choice-correct"]');
      if (await strokeNext.count()) {
        await strokeNext.first().click({ timeout: 800 }).catch(() => {});
      } else if (await correct.count()) {
        await correct.first().click({ timeout: 800 }).catch(() => {});
      }
    }
    const check = page.locator('button[data-tour="check"]:not([disabled])');
    if (await check.count()) {
      await check.first().click({ timeout: 800 }).catch(() => {});
    }
    const next = page.locator('[data-tour="next"]');
    if (await next.count()) {
      await next.first().click({ timeout: 800 }).catch(() => {});
    }
    await page.waitForTimeout(200);
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto(`/demo/kanji/${CHAR}`);
  const dismiss = page.locator('[data-tour="announce-dismiss"]');
  if (await dismiss.count()) await dismiss.click();
});

test(`a child rides ${CHAR} through all four beats: 出会う → わかる → ためす → 到着`, async ({
  page,
}) => {
  await expect(page.getByText(CHAR, { exact: true }).first()).toBeVisible();
  await driveToArrival(page);

  // 到着 — だいたい, no percentage, no score, no streak.
  await expect(page.getByText('だいたい', { exact: true })).toBeVisible();
  const bodyText = await page.locator('body').innerText();
  expect(bodyText).not.toMatch(/%|点|スコア|streak/i);

  const stored = await readStoredProgress(page);
  expect(stored).not.toBeUndefined();
});

test('I7: a completed session leaves the character at almost, never perfect, however many items are answered correctly', async ({
  page,
}) => {
  await driveToArrival(page);

  await expect(page.getByText('だいたい', { exact: true })).toBeVisible();
  await expect(page.getByText('かんぺき', { exact: true })).toHaveCount(0);

  const stored = (await readStoredProgress(page)) as { status: string; echoes: unknown[] } | undefined;
  expect(stored?.status).toBe('almost');
  expect(stored?.echoes).toEqual([]);
});

test('a wrong answer on a forceReteachOnWrong grade (G1, D19) correctly denies almost within the same ride — a real gap, documented, not silently dropped', async ({
  page,
}) => {
  // Grade 1 sets forceReteachOnWrong: true (grades.yaml, the architect's
  // locked values — "at six, re-meeting the character costs nothing and
  // carries no shame"). MR-4.6: any counted wrong answer sets
  // understood=false, and only the `understand` event (MR-3.2) sets it back
  // to true. kanji-session.tsx's onNext sends a wrong answer straight back
  // to わかる (the drive loop follows this automatically), but practice
  // continues to the NEXT item rather than re-offering the wronged one — so
  // a same-session retry corrects understood by re-passing わかる, but the
  // wronged lamp itself stays unlit/pending repair for the rest of this
  // ride. Either alone already denies almost; asserted together so both
  // real, current consequences of a wrong answer stay visible.
  let usedDecoy = false;
  await driveToArrival(page, {
    onDecoyOpportunity: () => {
      if (usedDecoy) return false;
      usedDecoy = true;
      return true;
    },
  });
  expect(usedDecoy).toBe(true);

  await expect(page.getByText('だいたい', { exact: true })).toHaveCount(0);
  await expect(page.getByText('かんぺき', { exact: true })).toHaveCount(0);

  const stored = (await readStoredProgress(page)) as
    | { status: string; understood: boolean; repairs: string[] }
    | undefined;
  // The wrong answer bounces back to わかる mid-ride (kanji-session.tsx's
  // onNext), and the drive loop naturally re-clicks "understood" on the way
  // through, which correctly restores understood=true per MR-3.2 — a wrong
  // answer alone doesn't leave understood false. But practice moves on to
  // the next item rather than re-offering the wronged one, so the wronged
  // lamp stays unlit and pending repair (MR-4.3/4.4). A pending repair alone
  // already forces status='fix' and denies almost/perfect (deriveStatus
  // checks repairs.length>0 before the encountered/understood/allLit
  // branch), regardless of understood.
  expect(stored?.repairs.length).toBeGreaterThan(0);
  expect(stored?.understood).toBe(true);
  expect(stored?.status).toBe('fix');
});

/** Clicks ride-on, retrying past the encounter dwell timer and re-dismissing
 * the train announce dialog if it reopens/intercepts mid-retry. */
async function clickRideOn(page: import('@playwright/test').Page) {
  for (let tick = 0; tick < 30; tick += 1) {
    const dismiss = page.locator('[data-tour="announce-dismiss"]');
    if (await dismiss.count()) await dismiss.first().click({ timeout: 500 }).catch(() => {});
    const rideOn = page.locator('[data-tour="ride-on"]:not([disabled])');
    if (await rideOn.count()) {
      await rideOn.first().click({ timeout: 500 }).catch(() => {});
      if (await page.locator('[data-tour="understood"]').count()) return;
    }
    await page.waitForTimeout(200);
  }
}

test.describe('accessibility (axe) — one pass per beat', () => {
  test('出会う', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('わかる', async ({ page }) => {
    await clickRideOn(page);
    await expect(page.locator('[data-tour="understood"]')).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('ためす', async ({ page }) => {
    await clickRideOn(page);
    for (let tick = 0; tick < 20; tick += 1) {
      const tapReadings = page.locator('button[data-tour="tap-readings"]');
      if (await tapReadings.count()) await tapReadings.first().click().catch(() => {});
      const speaker = page.locator('button[data-tour="speaker"]');
      if (await speaker.count()) await speaker.first().click().catch(() => {});
      const readingsAck = page.locator('[data-tour="readings-ack"]');
      if (await readingsAck.count()) await readingsAck.first().click().catch(() => {});
      const placeScroll = page.locator('[data-tour="place-scroll"]');
      if (await placeScroll.count()) await placeScroll.first().click().catch(() => {});
      const understood = page.locator('[data-tour="understood"]:not([disabled])');
      if (await understood.count()) {
        await understood.first().click();
        break;
      }
      await page.waitForTimeout(200);
    }
    await expect(page.locator('button[data-tour="choice-correct"], button[data-tour="stroke-next"]').first()).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('到着', async ({ page }) => {
    await driveToArrival(page);
    await expect(page.getByText('だいたい', { exact: true })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
