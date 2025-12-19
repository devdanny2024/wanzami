FROM node:20-alpine

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json tsconfig.json ./
COPY prisma ./prisma

RUN npm ci

# Copy source and build
COPY src ./src
COPY exports ./exports

RUN npm run build

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "dist/index.js"]

