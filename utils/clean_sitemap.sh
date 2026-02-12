#!/bin/bash
# Clean up sitemap URLs to use canonical (clean) URLs instead of index.html
if [[ -z "$QUARTO_PROJECT_RENDER_ALL" ]]; then
    echo "Skipping sitemap cleanup; QUARTO_PROJECT_RENDER_ALL is not set."
    exit 0
fi

# Get the directory where this script is located (utils/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the project root directory (parent of utils/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SITEMAP="$PROJECT_ROOT/_site/sitemap.xml"

if [ -f "$SITEMAP" ]; then
    echo "Cleaning sitemap URLs..."
    
    # Replace /index.html with / for directory index pages
    # Replace .html with nothing for top-level pages (but keep the URL valid)
    sed -i '' \
        -e 's|/index\.html</loc>|/</loc>|g' \
        -e 's|\.html</loc>|</loc>|g' \
        "$SITEMAP"
    
    echo "Sitemap cleaned successfully"
else
    echo "Sitemap not found at $SITEMAP"
fi
