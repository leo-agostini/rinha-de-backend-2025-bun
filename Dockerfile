FROM oven/bun:latest

WORKDIR /app
COPY package.json ./
COPY bun.lock ./
COPY src ./
COPY .env ./
RUN bun install
CMD ["bun", "run", "index.ts"]
