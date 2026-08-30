# Cloud Run deployment image for the kanji-densha pnpm monorepo (apps/web).
#
# Produces a standalone Node server (Nitro "node-server" preset, see
# apps/web/vite.config.ts) that binds 0.0.0.0:$PORT — the two Cloud Run
# runtime requirements that were previously unmet:
#   1. Bind address: 0.0.0.0, not localhost/127.0.0.1.
#   2. Port: read dynamically from the PORT env var Cloud Run injects,
#      defaulting to 8080 for local runs.

FROM node:22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /workspace

# --- deps: install once, cached across builds ---
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/content-schema/package.json packages/content-schema/package.json
COPY packages/content-build/package.json packages/content-build/package.json
COPY packages/engine/package.json packages/engine/package.json
COPY packages/store/package.json packages/store/package.json
RUN pnpm install --frozen-lockfile

# --- build: compile the workspace engine, the content pipeline, then the web app ---
FROM deps AS build
COPY . .
# apps/web depends on @kanji-densha/engine via its published dist/ (package.json
# "main"/"exports" point at ./dist/index.js), and dist/ is gitignored — never
# committed, only ever produced by running its own `tsc -b` build script. A
# fresh checkout (exactly what `COPY . .` above just did) has no dist/ at all,
# so the workspace import fails to resolve during `vite build` unless this
# runs first. `pnpm content:build` builds its own project-reference graph
# (content-build + content-schema) but never touches engine, since content
# generation has no dependency on it.
RUN pnpm --filter @kanji-densha/engine build
RUN pnpm content:build
RUN pnpm --filter @kanji-densha/web build

# --- runtime: only the built server + production deps ---
FROM node:22-slim AS runtime
WORKDIR /workspace
ENV NODE_ENV=production
COPY --from=build /workspace/apps/web/.output ./.output

# Cloud Run sets PORT at runtime (defaults to 8080 if unset, e.g. local `docker run`).
ENV PORT=8080
ENV HOST=0.0.0.0
EXPOSE 8080

# Nitro's node-server preset reads HOST/PORT directly from the environment,
# so this always binds whatever port Cloud Run assigns, on all interfaces.
CMD ["node", ".output/server/index.mjs"]
