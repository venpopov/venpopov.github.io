#!/bin/bash

# purge_css.sh
# if [[ -z "$QUARTO_PROJECT_RENDER_ALL" ]]; then
#     exit
# fi

# Get the directory where this script is located (utils/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the project root directory (parent of utils/)
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if node_modules exists, if not run npm install
if [[ ! -d "$SCRIPT_DIR/node_modules" ]]; then
    echo "Installing npm dependencies..."
    npm install --prefix "$SCRIPT_DIR"
fi

# Use local binaries from node_modules
PURGECSS="$SCRIPT_DIR/node_modules/.bin/purgecss"
UGLIFYJS="$SCRIPT_DIR/node_modules/.bin/uglifyjs"
UGLIFYCSS="$SCRIPT_DIR/node_modules/.bin/uglifycss"

echo "$(date +'%Y-%m-%dT%H:%M:%S') - $0 - CSS purge and minification..."

# See: https://purgecss.com/CLI.html
mkdir -p "$PROJECT_ROOT/temp_purgecss"
find "$PROJECT_ROOT/_site" -type f -name "*.css" \
    -exec echo {} \; \
    -exec "$PURGECSS" --css {} --content "$PROJECT_ROOT/_site/**/*.js" "$PROJECT_ROOT/_site/**/*.html" -o "$PROJECT_ROOT/temp_purgecss" \; \
    -exec bash -c ' mv "'"$PROJECT_ROOT"'/temp_purgecss/`basename {}`" "`dirname {}`" ' \;
rmdir "$PROJECT_ROOT/temp_purgecss"

# See: https://github.com/mishoo/UglifyJS
# minification of JS files
find "$PROJECT_ROOT/_site" -type f \
    -name "*.js" ! -name "*.min.*" ! -name "vfs_fonts*" \
    -exec echo {} \; \
    -exec "$UGLIFYJS" -o {}.min {} \; \
    -exec rm {} \; \
    -exec mv {}.min {} \;

# minification of CSS files
find "$PROJECT_ROOT/_site" -type f \
    -name "*.css" ! -name "*.min.*" \
    -exec echo {} \; \
    -exec "$UGLIFYCSS" --output {}.min {} \; \
    -exec rm {} \; \
    -exec mv {}.min {} \;

echo "$(date +'%Y-%m-%dT%H:%M:%S') - $0 - End."
