#!/usr/bin/env bash
set -e

# Clear out the preinstall block dynamically for Render's static builder
sed -i 's/"preinstall": ".*"//g' package.json

# Enable pnpm via Corepack (avoids writing to read-only /usr/lib/node_modules)
corepack enable
corepack prepare pnpm@latest --activate

# Install all workspace dependencies
pnpm install

# Build the frontend (BASE_PATH=/ since the app is served from the root on Render)
# PORT is required by vite.config.ts at parse time (for dev server config), set a dummy value
BASE_PATH=/ PORT=10000 pnpm --filter @workspace/mind-partner build

# Build the backend (esbuild bundle)
pnpm --filter @workspace/api-server build
