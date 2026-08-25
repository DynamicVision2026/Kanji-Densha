import { defineConfig, devices } from '@playwright/test';

// Runs against a production build (vite build + node .output/server/index.mjs),
// not the dev server: TanStack Start's dev server lazily JIT-compiles each
// route's module graph on first request, so hydration can legitimately lag
// well behind the page's `load` event on a cold dev-server hit — a real
// characteristic of dev mode, not a product bug, but exactly the kind of
// timing flakiness a CI suite must not be built on. A production build ships
// one pre-bundled hydration script with no lazy compilation, which is also
// closer to what a phone actually loads.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm build && PORT=3100 pnpm start',
    port: 3100,
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        // A real phone viewport, not a desktop window — this app's actual
        // device (spec §12: "the primary child device is a phone").
        ...devices['Pixel 7'],
        // This project's @playwright/test version expects a different
        // pinned chromium revision than the one pre-installed in this
        // environment; launch the pre-installed browser explicitly rather
        // than downloading another one.
        launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
      },
    },
  ],
});
