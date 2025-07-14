FROM node:alpine

# Use production node environment by default.


WORKDIR /usr/src/app
COPY package.json .
COPY . .
RUN npm install -g bun
RUN bun install
USER node

COPY . .

# Expose the port that the application listens on.
EXPOSE 8080

# Run the application.
CMD ["bun", "run", "src/index.ts"]
