## How to update the website

The website is generated using Quarto. After making any changes, run the following command to update the html files, check for dead links, and publish to github pages:

``` bash
quarto render && update_website
```

`update_website` is an alias for `quarto publish gh-pages --no-prompt --no-render --no-browser` defined in .zshrc [my dotfiles](https://github.com/venpopov/.dotfiles)

### Dead link checker

The `check_links.sh` script scans all rendered HTML files in `_site/` for broken links. It checks:
- External links (404 errors, timeouts, connection failures)
- Soft 404s (pages that return 200 but show "not found" content)
- Local file references

If broken links are found, you'll be prompted whether to continue publishing or stop to fix them.

**Configuration:** Edit `linkcheck.config.json` to customize:
- `siteDir`: Directory to scan (default: `_site`)
- `concurrency`: Number of parallel requests (default: 20)
- `timeout`: Request timeout in milliseconds (default: 10000)
- `excludePatterns`: URL patterns to skip (mailto:, tel:, etc.)
- `skipDomains`: Domains to skip checking
- `softNotFoundPatterns`: Patterns that indicate soft 404 pages

**Skip the check:** Use `./check_links.sh --skip` to skip link checking.

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
4.  Run `quarto render` to update the website
5.  Run `update_website` to push the changes to the server
6.  The new post should be available at `https://venpopov.com/posts/2024/new-post/`

### Automated way

Use the shell command `add_new_post`. This is a bash script in `~/scripts` and also available on [my Github](https://github.com/venpopov/scripts)
