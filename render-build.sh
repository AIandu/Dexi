#!/usr/bin/env bash
set -e

# Clear out the preinstall block dynamically for Render's static builder
sed -i 's/"preinstall": ".*"//g' package.json

# Enable pnpm via Corepack, installed to a writable directory
# (Render's /usr/bin is read-only and already has a system pnpm symlink)
mkdir -p "$HOME/.local/bin"
export COREPACK_HOME="$HOME/.corepack"
corepack enable --install-directory "$HOME/.local/bin"
export PATH="$HOME/.local/bin:$PATH"
corepack prepare pnpm@latest --activate

# Install all workspace dependencies
pnpm install

# Build the frontend (BASE_PATH=/ since the app is served from the root on Render)
# PORT is required by vite.config.ts at parse time (for dev server config), set a dummy value
BASE_PATH=/ PORT=10000 pnpm --filter @workspace/mind-partner build

# Build the backend (esbuild bundle)
pnpm --filter @workspace/api-server build
