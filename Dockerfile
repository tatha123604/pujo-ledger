FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm install --omit=dev
ENV NODE_ENV=production
CMD ["node", "server.js"]
