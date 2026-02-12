## Initial Setup (New Machine)

After cloning the repository:

```bash
# Install Node.js dependencies (CSS/JS minification tools)
cd utils && npm install

# Install R packages (in R console)
renv::restore()
```

The `utils/purge_css.sh` script will auto-install npm dependencies if `utils/node_modules/` doesn't exist.

## How to update the website

The website is automatically built and deployed via GitHub Actions whenever changes are pushed to the `main` branch. See `.github/workflows/publish.yml` for details.

### Local Development

To preview changes locally before pushing:

``` bash
quarto render
```

This will generate the website in the `_site/` directory. You can preview it locally by opening `_site/index.html` in your browser or by running `quarto preview`.

### Dead link checker

The `utils/check_links.sh` script scans all rendered HTML files in `_site/` for broken links. It checks:
- External links (404 errors, timeouts, connection failures)
- Soft 404s (pages that return 200 but show "not found" content)
- Local file references

If broken links are found, you'll be prompted whether to continue publishing or stop to fix them.

**Configuration:** Edit `utils/linkcheck.config.json` to customize:
- `siteDir`: Directory to scan (default: `_site`)
- `concurrency`: Number of parallel requests (default: 20)
- `timeout`: Request timeout in milliseconds (default: 10000)
- `excludePatterns`: URL patterns to skip (mailto:, tel:, etc.)
- `skipDomains`: Domains to skip checking
- `softNotFoundPatterns`: Patterns that indicate soft 404 pages

**Skip the check:** Use `./utils/check_links.sh --skip` to skip link checking.

It is included to run automatically after `quarto render` in the `_quarto.yml` config file.

## How to add a new blog post

### Manual way

Posts are Quarto documents `.qmd` files, which are stored in the `posts` directory. The posts directory is organized by year. To add a new post:

1.  Create a new folder in the corresponding year directory, e.g. `posts/2024/new-post`
2.  Create a new `.qmd` file in the new folder, e.g. `posts/2024/new-post/index.qmd`

It should have a YAML front matter with the following fields:

``` yaml
---
title: ""
subtitle: ""
categories: []
date: ""
---
```

3.  Write the content of the post in the `.qmd` file
4.  Commit and push the changes to the `main` branch
5.  GitHub Actions will automatically build and deploy the website
6.  The new post will be available at `https://venpopov.com/posts/2024/new-post/`

### Automated way

Use the shell command `add_new_post`. This is a bash script in `~/scripts` and also available on [my Github](https://github.com/venpopov/scripts)
