FROM node:25.9.0

ENV DEBIAN_FRONTEND=noninteractive

ENV NVIDIA_VISIBLE_DEVICES=all
ENV NVIDIA_DRIVER_CAPABILITIES=compute,utility

RUN apt-get update && apt-get install -y \
    sudo \
    curl \
    git \
    wget \
    htop \
    pciutils \
    build-essential \
&& rm -rf /var/lib/apt/lists/*

RUN if id "vibecoder" >/dev/null 2>&1; then \
      echo "vibecoder user already exists, skipping"; \
    else \
      usermod -l vibecoder -d /home/vibecoder node && \
      groupmod -n vibecoder node && \
      usermod -aG sudo vibecoder && \
      echo "vibecoder ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers; \
    fi

RUN mkdir -p /workspaces && chown vibecoder:vibecoder /workspaces

USER vibecoder
WORKDIR /home/vibecoder

ENV NPM_CONFIG_PREFIX=/home/vibecoder/.npm-global
ENV PATH="/home/vibecoder/.npm-global/bin:/home/vibecoder/.local/bin:${PATH}"
ENV SHELL=/bin/bash
