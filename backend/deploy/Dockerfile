# Wanzami app image for the VPS.
# Single image used by all three roles (API / cron / transcode); the role is
# selected by `command:` in docker-compose. Identical to the repo Dockerfile
# except it installs ffmpeg so the transcode worker (fluent-ffmpeg) works.
FROM node:20-alpine

# ffmpeg for the transcode worker. Harmless for the API/cron roles.
RUN apk add --no-cache ffmpeg
ENV FFMPEG_PATH=/usr/bin/ffmpeg

WORKDIR /app

COPY package.json package-lock.json tsconfig.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

COPY src ./src
COPY certs ./certs
RUN mkdir -p exports
RUN npm run build

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Default role = API. cron / transcode override `command` in compose.
CMD ["node", "dist/index.js"]
