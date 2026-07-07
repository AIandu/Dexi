#!/usr/bin/env bash
# Clear out the preinstall block dynamically for Render's static builder
sed -i 's/"preinstall": ".*"//g' package.json

# Install pnpm globally using the system's native npm
npm install -g pnpm

# Run the proper monorepo installation and frontend build
pnpm install
pnpm --filter @workspace/mind-partner build
