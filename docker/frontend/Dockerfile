# Study Buddy Frontend - Multi-stage Docker Build
# Uses Node 20-alpine for build, Nginx 1.25-alpine for serving

# =============================================================================
# Builder Stage - Build the React application
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for layer caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --ignore-scripts

# Copy source code
COPY frontend/ ./

# Build argument for API URL (must be set at build time for Vite)
ARG VITE_API_URL=http://localhost:8000/api/v1
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build

# =============================================================================
# Runtime Stage - Serve with Nginx
# =============================================================================
FROM nginx:1.25-alpine AS runtime

# Remove default nginx configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Cloud Run uses port 8080 by default
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
