// M3 exit criteria (docs/prompts/kickoff-m2-m3.md): one happy path through all
// four beats, a completed session lands at almost and never perfect however
// many items are answered correctly (I7), and an axe accessibility pass on
// each beat. Runs against a production build (see playwright.config.ts) —
// TanStack Start's dev server lazily compiles on first request, which is a
// real dev-mode characteristic, not something a CI suite should depend on.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const STORAGE_KEY = 'kanji-densha:v1:progress:guest';

async function readStoredProgress(page: import('@playwright/test').Page) {
  const raw = await page.evaluate((k) => window.localStorage.getItem(k), STORAGE_KEY);
  return raw === null ? null : (JSON.parse(raw) as { 山: unknown });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('a child rides 山 through all four beats: 出会う → わかる → ためす → 到着', async ({ page }) => {
  // 出会う — the hero character and the golden copy are visible, unscored.
  await expect(page.getByText('山', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('やまに のぼると、とおくまで みえるよ。')).toBeVisible();
  await page.getByRole('button', { name: 'のった！' }).click();

  // わかる — no audio exists yet (D18), so I10 means zero speaker buttons, not
  // a broken or fallback one.
  await expect(page.getByRole('button', { name: /きく/ })).toHaveCount(0);
  await expect(page.getByText('サン')).toBeVisible();
  await expect(page.getByText('やま')).toBeVisible();
  await page.getByRole('button', { name: 'わかった！' }).click();

  // ためす — reading, then meaning, then the shape placeholder (Q15).
  await expect(page.getByText('どう よむ？')).toBeVisible();
  await page.getByRole('button', { name: 'やま', exact: true }).click();

  await expect(page.getByText('どういう いみ？')).toBeVisible();
  await page.getByRole('button', { name: 'たかい つち の ところ' }).click();

  await expect(page.getByText('かきかたを みてみよう。')).toBeVisible();
  await page.getByRole('button', { name: 'できた！' }).click();

  // 到着 — だいたい, no percentage, no score, no streak.
  await expect(page.getByText('だいたい', { exact: true })).toBeVisible();
  await expect(page.getByText(/かんぺきに なるよ/)).toBeVisible();
  const bodyText = await page.locator('body').innerText();
  expect(bodyText).not.toMatch(/%|点|スコア|streak/i);

  const stored = await readStoredProgress(page);
  expect(stored).not.toBeNull();
});

test('I7: a completed session leaves the character at almost, never perfect, however many items are answered correctly', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'のった！' }).click();
  await expect(page.getByRole('button', { name: 'わかった！' })).toBeVisible();
  await page.getByRole('button', { name: 'わかった！' }).click();
  await expect(page.getByText('どう よむ？')).toBeVisible();

  await page.getByRole('button', { name: 'やま', exact: true }).click();
  await expect(page.getByText('どういう いみ？')).toBeVisible();
  await page.getByRole('button', { name: 'たかい つち の ところ' }).click();
  await expect(page.getByText('かきかたを みてみよう。')).toBeVisible();
  await page.getByRole('button', { name: 'できた！' }).click();

  await expect(page.getByText('だいたい', { exact: true })).toBeVisible();
  await expect(page.getByText('かんぺき', { exact: true })).toHaveCount(0);

  const stored = await readStoredProgress(page);
  const progress = stored?.山 as { status: string; echoes: unknown[] } | undefined;
  expect(progress?.status).toBe('almost');
  expect(progress?.echoes).toEqual([]);
});

test('Q16: a wrong answer on a forceReteachOnWrong grade (G1) sends the child back to わかる, and a correct retry after that still reaches だいたい', async ({
  page,
}) => {
  // Grade 1 sets forceReteachOnWrong: true (grades.yaml, the architect's
  // locked values — "at six, re-meeting the character costs nothing and
  // carries no shame"). MR-4.6: any counted wrong answer sets
  // understood=false, and only the `understand` event (MR-3.2) sets it back
  // to true. Practice.tsx now detours to わかる (Understand's `reteach`
  // framing) when that happens, then resumes ためす on the SAME item once the
  // child re-confirms — the train backing up one station, not a dead end and
  // not a restart of items already answered correctly.
  await page.getByRole('button', { name: 'のった！' }).click();
  await expect(page.getByRole('button', { name: 'わかった！' })).toBeVisible();
  await page.getByRole('button', { name: 'わかった！' }).click();
  await expect(page.getByText('どう よむ？')).toBeVisible();

  await page.getByRole('button', { name: 'かわ', exact: true }).click(); // wrong, counted

  // Reteach: back at わかる, with the warm framing, not the inline retry hint.
  await expect(page.getByText('もういちど みてみよう')).toBeVisible();
  await expect(page.getByText('どう よむ？')).toHaveCount(0);
  await page.getByRole('button', { name: 'わかった！' }).click();

  // Resumes on the SAME item (still asking how to read 山), not a restart.
  await expect(page.getByText('どう よむ？')).toBeVisible();
  await page.getByRole('button', { name: 'やま', exact: true }).click(); // correct, advances

  await expect(page.getByText('どういう いみ？')).toBeVisible();
  await page.getByRole('button', { name: 'たかい つち の ところ' }).click();
  await expect(page.getByText('かきかたを みてみよう。')).toBeVisible();
  await page.getByRole('button', { name: 'できた！' }).click();

  await expect(page.getByText('だいたい', { exact: true })).toBeVisible();

  const stored = await readStoredProgress(page);
  const progress = stored?.山 as { status: string; understood: boolean; lamps: Record<string, boolean> } | undefined;
  expect(progress?.lamps).toEqual({ reading: true, meaning: true, shape: true });
  expect(progress?.understood).toBe(true);
  expect(progress?.status).toBe('almost');
});

test.describe('accessibility (axe) — one pass per beat', () => {
  test('出会う', async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('わかる', async ({ page }) => {
    await page.getByRole('button', { name: 'のった！' }).click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('ためす', async ({ page }) => {
    await page.getByRole('button', { name: 'のった！' }).click();
    await page.getByRole('button', { name: 'わかった！' }).click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('到着', async ({ page }) => {
    await page.getByRole('button', { name: 'のった！' }).click();
    await page.getByRole('button', { name: 'わかった！' }).click();
    await page.getByRole('button', { name: 'やま', exact: true }).click();
    await page.getByRole('button', { name: 'たかい つち の ところ' }).click();
    await page.getByRole('button', { name: 'できた！' }).click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
