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

# --- build: compile the content pipeline, then the web app ---
FROM deps AS build
COPY . .
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
