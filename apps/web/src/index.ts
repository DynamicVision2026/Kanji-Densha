// apps/web — TanStack Start + React + Tailwind (spec §12). M0 placeholder only;
// the (child) and (parent) route groups and the four-beat session flow arrive
// from M3. Boundary rules (eslint.config.js) already forbid this app from
// importing raw content/ or content-build (I2, architecture §3) — enforced now,
// before there is any code to violate them.
export const WEB_PLACEHOLDER = 'web' as const;
