FROM oven/bun:1

# Install docker CLI
RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN bun install

COPY src ./src

CMD ["bun", "run", "src/index.ts"]
