new_post <- function(folder, basedir = "posts") {
  # Create the post filename
  year <- format(Sys.Date(), "%Y")
  dir <- fs::dir_create(file.path(basedir, year, folder), recurse = TRUE)
  post_filename <- file.path(dir, "index.qmd")
  
  # Create the post
  if (!file.exists(post_filename)) {
    file.create(post_filename)
  } else {
    stop("Post already exists")
  }
  
  # Write the post metadata
  writeLines(
    c(
    "---", 
    "title: ", 
    "subtitle: ",
    "categories: []",
    "image: ",
    glue::glue("date: {Sys.Date()}"),
    "---"
    ), post_filename
  )
  
  # Open the post in the default editor
  file.edit(post_filename)
}
