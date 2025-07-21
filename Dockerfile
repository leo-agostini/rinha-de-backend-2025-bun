# Stage 1: build
FROM oven/bun AS builder

WORKDIR /app
COPY . .
RUN bun build --compile --minify --sourcemap ./src/index.ts --outfile server

# Stage 2: runtime
FROM oven/bun

WORKDIR /app
COPY --from=builder /app/server .
COPY .env .

RUN chmod +x ./server

CMD ["./server"]
