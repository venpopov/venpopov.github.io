#!/bin/bash
# check_links.sh - Check for dead links before publishing
#
# This script runs the link checker and prompts the user if broken links are found.
# It's designed to be run before `quarto publish` to catch dead links early.
#
# Usage: 
#   ./check_links.sh          # Run from project root
#   ./check_links.sh --skip   # Skip the check and proceed

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check for skip flag
if [[ "$1" == "--skip" ]]; then
    echo "⏭️  Skipping link check..."
    exit 0
fi

# Read siteDir from config file
CONFIG_FILE="${SCRIPT_DIR}/linkcheck.config.json"
if [[ -f "${CONFIG_FILE}" ]]; then
    SITE_DIR=$(node -e "console.log(JSON.parse(require('fs').readFileSync('${CONFIG_FILE}', 'utf8')).siteDir || '_site')")
else
    SITE_DIR="_site"
fi

# Check if site directory exists
if [[ ! -d "${SCRIPT_DIR}/${SITE_DIR}" ]]; then
    echo "⚠️  No ${SITE_DIR} directory found. Run 'quarto render' first."
    exit 1
fi

# Check if node_modules exists, if not install dependencies
if [[ ! -d "${SCRIPT_DIR}/node_modules" ]]; then
    echo "📦 Installing link checker dependencies..."
    npm install --prefix "${SCRIPT_DIR}" --silent
fi

echo "🔗 Running dead link checker..."
echo ""

# Run the link checker
if node "${SCRIPT_DIR}/check-links.js"; then
    echo "✅ All links are valid. Proceeding with publish..."
    exit 0
else
    echo ""
    echo "⚠️  Broken links detected!"
    echo ""
    read -p "Do you want to continue publishing anyway? (y/N) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "⏩ Continuing with publish..."
        exit 0
    else
        echo "❌ Publish cancelled. Please fix the broken links and try again."
        exit 1
    fi
fi
