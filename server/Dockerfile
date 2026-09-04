FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server ./server
COPY scripts ./scripts
CMD ["node", "server/index.mjs"]
