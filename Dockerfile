FROM oven/bun:1

# Install required tools
RUN apt-get update && apt-get install -y \
    curl \
    docker.io \
    && ln -sf /usr/bin/docker /usr/local/bin/docker \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN bun install

COPY src ./src

CMD ["bun", "run", "src/index.ts"]
