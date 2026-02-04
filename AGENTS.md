# AGENTS.md

## Repository Overview

This is a personal academic website built with Quarto, featuring publications, a CV, and a blog. The site is statically generated and deployed to GitHub Pages.

## Key Commands

### Build and Deploy

Render the website locally:
```bash
quarto render
```

Publish to GitHub Pages.
```bash
quarto publish gh-pages --no-prompt --no-render --no-browser
```
### Working with Node.js Dependencies

This project uses npm for Node.js package management (CSS/JS minification tools). When first setting up:
```bash
npm install
```

This installs `purgecss`, `uglify-js`, and `uglifycss` locally. The `purge_css.sh` script will auto-install these if `node_modules/` doesn't exist.

### Working with R Environment

This project uses `renv` for R package management. When first setting up or when dependencies change:
```bash
# In R console
renv::restore()  # Install packages from renv.lock
renv::snapshot() # Update renv.lock after adding packages
```

The `.Rprofile` automatically loads the renv environment and sources all R scripts in the `R/` directory.

### Blog Post Management

Create a new blog post using the shell script
```bash
add_new_post
```

The command will prompt for input for title, subtitle and categories.

This creates `posts/{year}/{title-slug}/index.qmd` with proper YAML frontmatter.

Manual post creation structure:
- Posts are organized by year: `posts/2024/`, `posts/2025/`, etc.
- Each post is in its own folder with an `index.qmd` file
- Required YAML frontmatter:
  ```yaml
  ---
  title: ""
  subtitle: ""
  categories: []
  date: "YYYY-MM-DD"
  ---
  ```

## Architecture and Structure

### Content Organization

- **`index.qmd`** - Homepage/about page
- **`publications.qmd`** - Publications list with academic papers
- **`posts.qmd`** - Blog listing page
- **`CV/index.qmd`** - CV page that embeds `CV/cv.pdf`
- **`posts/{year}/{post-name}/index.qmd`** - Individual blog posts
- **`R/functions.R`** - Custom R functions loaded automatically via `.Rprofile`

### Configuration Files

- **`_quarto.yml`** - Main Quarto project configuration
  - Defines website structure, navigation, theming
  - Configures post-render script (`purge_css.sh`)
  - Sets execution options (`freeze: auto`, `cache: true`)
- **`posts/_metadata.yml`** - Default settings for all blog posts
  - Giscus comments configuration
  - License (CC BY)
  - Author metadata
  - Default knitr execution options
- **`.Rprofile`** - Loads renv and sources R scripts from `R/` directory
- **`renv.lock`** - R package dependencies

### Quarto Extensions

The site uses several Quarto extensions located in `_extensions/`:
- `quarto-ext/fontawesome` - Font Awesome icons
- `schochastics/academicons` - Academic icons
- `pandoc-ext/section-bibliographies` - Bibliography management

### Theming and Styling

- **`theme-dark.scss`** - Dark theme customization
- **`styles.css`** - Custom CSS styles
- Base theme: Cosmo (with dark variant)

### Build Process

1. Quarto renders `.qmd` files to HTML
2. Rendered output goes to `_site/`
3. Post-render script `purge_css.sh` runs (only during full project renders):
   - Purges unused CSS using purgecss
   - Minifies JS files using uglifyjs
   - Minifies CSS files using uglifycss
4. Computed results are cached in `_freeze/` (controlled by `freeze: auto`)

### R Code in Posts

- Blog posts can contain R code chunks
- Execution is frozen by default (`freeze: true` in `posts/_metadata.yml`)
- Computed outputs are cached to avoid re-running expensive computations
- The `bmm` package (Bayesian Measurement Modeling) is frequently referenced in posts

### Important Files Not to Edit

- Files in `_site/` - Generated output, will be overwritten
- Files in `_freeze/` - Cached computation results
- Files in `.quarto/` - Quarto internal files

## Dependencies

### Required Software

- **Quarto** - Static site generator (installed at `/Users/venpopov/.local/bin/quarto`)
- **R** - Version 4.4.2 (specified in `renv.lock`)
- **Node.js** - Required for CSS/JS minification tools

### Node.js Packages (managed via package.json)

Installed locally via `npm install`:
- `purgecss` - CSS purging (removes unused CSS)
- `uglify-js` - JavaScript minification
- `uglifycss` - CSS minification

These are defined in `package.json` as devDependencies and used by `purge_css.sh`.

### Key R Packages

The site uses numerous R packages managed by renv. Key packages include:
- Statistical/modeling packages (Stan ecosystem, brms, etc.)
- Data manipulation (tidyverse packages)
- Visualization (ggplot2)
- See `renv.lock` for complete list

## Special Notes

- The site is configured for deployment to `venpopov.com` (specified in `CNAME`)
- Google Analytics is enabled (ID in `_quarto.yml`)
- Blog posts support Giscus comments (GitHub discussions-based)
- All posts are licensed under CC BY by default
- The `.Rprofile` pattern of auto-sourcing R scripts means new helper functions should be added to `R/` directory
