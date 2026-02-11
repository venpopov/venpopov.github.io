FROM rocker/r-ver:4.5.2

# Install system dependencies
RUN apt-get update && apt-get install -y \
  curl \
  git \
  libcurl4-openssl-dev \
  libssl-dev \
  libxml2-dev \
  libfontconfig1-dev \
  libharfbuzz-dev \
  libfribidi-dev \
  libfreetype6-dev \
  libpng-dev \
  libtiff5-dev \
  libjpeg-dev \
  pandoc \
  && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

# Install Quarto
ARG QUARTO_VERSION="1.6.39"
RUN curl -LO https://github.com/quarto-dev/quarto-cli/releases/download/v${QUARTO_VERSION}/quarto-${QUARTO_VERSION}-linux-amd64.deb \
  && dpkg -i quarto-${QUARTO_VERSION}-linux-amd64.deb \
  && rm quarto-${QUARTO_VERSION}-linux-amd64.deb

# Set working directory
WORKDIR /workspace

# Copy renv files (not .Rprofile — it loads packages/scripts not available at build time)
COPY renv.lock renv.lock
COPY renv/activate.R renv/activate.R

# Install renv and restore packages to a global cache
# Using --vanilla to skip .Rprofile which requires packages not yet available
# RENV_PATHS_CACHE stores installed packages in a fixed location
ENV RENV_PATHS_CACHE=/renv/cache

# Use Posit Package Manager for pre-compiled Linux binaries
ENV RENV_CONFIG_PPM_ENABLED=TRUE
ENV RENV_CONFIG_PPM_URL=https://packagemanager.posit.co/cran/__linux__/noble/latest

# Step 1: Install renv from PPM
RUN R --vanilla -e "install.packages('renv', repos = 'https://packagemanager.posit.co/cran/__linux__/noble/latest')"

# Step 2: Restore packages via renv, excluding Stan dev packages (broken source tarballs)
# Then install Stan packages from r-universe binaries into the renv library
RUN R --vanilla -e "\
  renv::consent(provided = TRUE); \
  stan_pkgs <- c('StanHeaders', 'rstan', 'rstantools', 'bayesplot', 'loo', 'posterior', 'cmdstanr'); \
  renv::restore(exclude = stan_pkgs); \
  install.packages(stan_pkgs, repos = 'https://stan-dev.r-universe.dev', lib = .libPaths()[1]) \
  "

# Copy Node.js package files and install
COPY utils/package.json utils/package.json
RUN cd utils && npm install

# Set environment variable to indicate container environment
ENV IN_CONTAINER=true

# Default command
CMD ["/bin/bash"]
