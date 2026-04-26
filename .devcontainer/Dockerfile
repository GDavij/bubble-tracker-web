FROM node:25.9.0

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    sudo \
    curl \
    git \
    wget \
    htop \
    && rm -rf /var/lib/apt/lists/*

RUN if id "vibecoder" >/dev/null 2>&1; then \
      echo "vibecoder user already exists, skipping"; \
    else \
      useradd -m -s /bin/bash -u 1000 -G sudo vibecoder && \
      echo "vibecoder ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/vibecoder && \
      chmod 0440 /etc/sudoers.d/vibecoder; \
    fi

RUN mkdir -p /workspaces && chown vibecoder:vibecoder /workspaces && \
    mkdir -p /home/vibecoder/.npm-global && \
    chown -R vibecoder:vibecoder /home/vibecoder

USER vibecoder

ENV NPM_CONFIG_PREFIX=/home/vibecoder/.npm-global
ENV PATH=/home/vibecoder/.npm-global/bin:/home/vibecoder/.local/bin:/usr/local/bin:$PATH
ENV SHELL=/bin/bash
