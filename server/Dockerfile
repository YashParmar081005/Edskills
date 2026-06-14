# Express + Socket.io API — container image for InsForge compute / Fly.io.
FROM node:22-alpine

WORKDIR /app

# Install only production deps first (better layer caching).
COPY package*.json ./
RUN npm ci --omit=dev

# App source.
COPY . .

# Fly/compute injects PORT; the app reads it via env (defaults to 5500 locally).
ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "src/server.js"]
