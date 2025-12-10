FROM node:20-alpine

WORKDIR /app

# Copy package files from server directory
# Note: Build context is repo root when using server/Dockerfile
COPY server/package.json server/pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy server application files
COPY server/ ./

# Expose port
EXPOSE 3001

# Start server
CMD ["node", "server.js"]

