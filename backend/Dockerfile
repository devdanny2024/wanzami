FROM node:20-alpine

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json tsconfig.json ./
COPY prisma ./prisma
COPY .env .env

RUN npm ci
RUN npx prisma generate

# Copy source and build
COPY src ./src
RUN mkdir -p exports

RUN npm run build

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

CMD ["node", "dist/index.js"]

