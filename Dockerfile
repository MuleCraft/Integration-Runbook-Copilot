# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# ✅ Copy .env so Vite can read it during build
COPY .env ./

# Copy rest of the code
COPY . .

# Build project
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app

# Install only the production dependencies we need
RUN npm init -y && npm install express && \
    echo '{"type": "module"}' > package.json

# Copy build output and server.js to runtime container
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/.env ./.env

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]