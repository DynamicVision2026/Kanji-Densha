// Registered by TanStack Start's build-time convention (src/router.tsx,
// exporting getRouter) — StartClient/StartServer resolve it internally.
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen.js';

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
  });
}
