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

# Copy renv files
COPY renv.lock renv.lock
COPY .Rprofile .Rprofile
COPY renv/activate.R renv/activate.R

# Install renv and restore packages
RUN R -e "install.packages('renv', repos = c(CRAN = 'https://cloud.r-project.org'))" \
  && R -e "renv::restore()"

# Copy Node.js package files and install
COPY utils/package.json utils/package.json
RUN cd utils && npm install

# Set environment variable to indicate container environment
ENV IN_CONTAINER=true

# Default command
CMD ["/bin/bash"]
