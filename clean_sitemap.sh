#!/bin/bash
# Clean up sitemap URLs to use canonical (clean) URLs instead of index.html

SITEMAP="_site/sitemap.xml"

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
