# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --frozen-lockfile

# Stage 2: Production
FROM node:18-alpine

WORKDIR /usr/src/app

# Copy dependencies from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./

# Copy app source
COPY . .

# Set permissions for node user
RUN chown -R node:node /usr/src/app

# Use non-root user
USER node

EXPOSE 3000

CMD [ "node", "server.js" ]
