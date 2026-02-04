#!/bin/bash

# purge_css.sh
# if [[ -z "$QUARTO_PROJECT_RENDER_ALL" ]]; then
#     exit
# fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
mkdir -p ./temp_purgecss
find ./_site -type f -name "*.css" \
    -exec echo {} \; \
    -exec "$PURGECSS" --css {} --content "./_site/**/*.js" "./_site/**/*.html" -o ./temp_purgecss \; \
    -exec bash -c ' mv "./temp_purgecss/`basename {}`" "`dirname {}`" ' \;
rmdir ./temp_purgecss

# See: https://github.com/mishoo/UglifyJS
# minification of JS files
find ./_site -type f \
    -name "*.js" ! -name "*.min.*" ! -name "vfs_fonts*" \
    -exec echo {} \; \
    -exec "$UGLIFYJS" -o {}.min {} \; \
    -exec rm {} \; \
    -exec mv {}.min {} \;

# minification of CSS files
find ./_site -type f \
    -name "*.css" ! -name "*.min.*" \
    -exec echo {} \; \
    -exec "$UGLIFYCSS" --output {}.min {} \; \
    -exec rm {} \; \
    -exec mv {}.min {} \;

echo "$(date +'%Y-%m-%dT%H:%M:%S') - $0 - End."
