# Stage 1: Build
FROM oven/bun AS builder

WORKDIR /app
COPY . .
RUN bun install
RUN bun run build

# Stage 2: Runtime
FROM oven/bun:slim

WORKDIR /app

# Copia o binário e os workers compilados
COPY --from=builder /app/dist/server ./server
COPY --from=builder /app/dist/workers ./workers
COPY --from=builder /app/.env .env

RUN chmod +x ./server

CMD ["./server"]
