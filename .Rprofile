if (requireNamespace("rprofile", quietly = TRUE)) {
  rprofile::load()
}

local({
  scripts <- list.files("R", pattern = "\\.R$", full.names = TRUE)
  for (script in scripts) {
    source(script)
  }
})
