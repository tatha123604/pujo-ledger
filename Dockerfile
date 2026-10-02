FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm install --global serve
ENV NODE_ENV=production
CMD ["sh", "-c", "serve -s . -l ${PORT:-3000}"]
