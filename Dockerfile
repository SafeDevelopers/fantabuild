FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application files
COPY . .

# Accept build arguments for environment variables
# CapRover automatically passes environment variables as build args
# These will be embedded at build time by Vite
ARG VITE_API_URL
ARG VITE_API_BASE_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the app
# Note: If VITE_API_URL is not provided, the build will succeed
# but the app will fail at runtime (which is caught by config/api.ts)
RUN pnpm build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
