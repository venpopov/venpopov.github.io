The website is currently hosted on Blue Host

## How to update the website

The website is generated using Quarto. After making any changes, run the following command to update the html files, which are stored in the `_site` directory:

```bash
quarto render
```

After rendering, push the changes to the server using the following command:

```bash
rsync -avz --progress --delete ~/venpopov.com/_site/ venpopov.com:/home4/venpopov/public_html/
```

To make it easier, I have setup the following alias in my `zshrc` file:

```bash
alias update_website="rsync -avz --progress --delete ~/venpopov.com/_site/ venpopov.com:/home4/venpopov/public_html/"
```

So I can just run `update_website` to update the website.

## How to add a new blog post

Posts are Quarto documents `.qmd` files, which are stored in the `posts` directory. The posts directory is organized by year. To add a new post:

1. Create a new folder in the corresponding year directory, e.g. `posts/2024/new-post`
2. Create a new `.qmd` file in the new folder, e.g. `posts/2024/new-post/index.qmd`

It should have a YAML front matter with the following fields:

```yaml
---
title: ""
subtitle: ""
categories: []
date: ""
---
```

3. Write the content of the post in the `.qmd` file
4. Run `quarto render` to update the website
5. Run `update_website` to push the changes to the server
6. The new post should be available at `https://venpopov.com/posts/2024/new-post/`


