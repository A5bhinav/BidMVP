#!/usr/bin/env bash
# scripts/verify.sh — Single verification entrypoint
# Runs lint + production build. Both must pass with zero errors.
# Usage: npm run verify  (or:  bash scripts/verify.sh)

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[0;32m'
RED='\033[0;31m'
RESET='\033[0m'

echo -e "${BOLD}═══════════════════════════════════════${RESET}"
echo -e "${BOLD}  Ralph Loop — Verification${RESET}"
echo -e "${BOLD}═══════════════════════════════════════${RESET}"
echo ""

# Step 1: Lint
echo -e "${BOLD}[1/2] Running ESLint...${RESET}"
if npx next lint --quiet 2>&1; then
  echo -e "${GREEN}✓ Lint passed${RESET}"
else
  echo -e "${RED}✗ Lint failed — fix errors before continuing${RESET}"
  exit 1
fi
echo ""

# Step 2: Build
echo -e "${BOLD}[2/2] Running production build...${RESET}"
if npx next build 2>&1; then
  echo -e "${GREEN}✓ Build passed${RESET}"
else
  echo -e "${RED}✗ Build failed — fix errors before continuing${RESET}"
  exit 1
fi
echo ""

echo -e "${GREEN}${BOLD}═══════════════════════════════════════${RESET}"
echo -e "${GREEN}${BOLD}  ✓ All checks passed — safe to ship${RESET}"
echo -e "${GREEN}${BOLD}═══════════════════════════════════════${RESET}"
