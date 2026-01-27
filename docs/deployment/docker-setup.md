# Docker Setup Guide

This guide covers building and running Study Buddy using Docker containers.

## Prerequisites

- Docker 20.10+ with Docker Compose V2
- 2GB+ available RAM
- API keys for AI features (optional)

## Quick Start

```bash
# 1. Clone and navigate to the project
cd my-ai-study-buddy

# 2. Copy environment template
cp .env.docker.example .env.docker

# 3. Build and start containers
docker-compose up --build
```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Configuration

### Environment Variables

Edit `.env.docker` before starting containers:

```bash
# Required: Set a secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Optional: Add AI API keys for full functionality
ANTHROPIC_API_KEY=your-key
GEMINI_API_KEY=your-key
```

### Storage Options

| Backend | Use Case | Configuration |
|---------|----------|---------------|
| `json` | Development | `STORAGE_BACKEND=json` |
| `sqlite` | Single-instance production | `STORAGE_BACKEND=sqlite` |
| `supabase` | Cloud/multi-user | Requires Supabase credentials |

## Building Images

### Build Both Services

```bash
docker-compose build
```

### Build Individual Services

```bash
# Backend only
docker-compose build backend

# Frontend only (with custom API URL)
docker-compose build frontend --build-arg VITE_API_URL=https://api.example.com/api/v1
```

### Build for Production

```bash
# Uses production-like settings
docker-compose -f docker-compose.prod.yml build
```

## Running Containers

### Development Mode

```bash
# Start with logs in foreground
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
```

### Production-like Mode

```bash
# Requires all environment variables set
export JWT_SECRET=$(openssl rand -base64 32)
export CORS_ORIGINS=http://localhost:3000
export VITE_API_URL=http://localhost:8000/api/v1

docker-compose -f docker-compose.prod.yml up -d
```

### Stop Containers

```bash
# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (deletes data!)
docker-compose down -v
```

## Data Persistence

### Volume Mounts

Development mode mounts local directories:
- `./data` → `/app/data` (JSON/SQLite storage)
- `./uploads` → `/app/uploads` (uploaded images)

### Backup Data

```bash
# Backup data directory
tar -czf backup-$(date +%Y%m%d).tar.gz data/ uploads/

# Restore from backup
tar -xzf backup-20240101.tar.gz
```

## Health Checks

Both services include health checks:

```bash
# Check backend health
curl http://localhost:8000/health

# Check frontend health
curl http://localhost:3000/healthz

# View container health status
docker-compose ps
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker-compose logs backend
docker-compose logs frontend

# Rebuild without cache
docker-compose build --no-cache
```

### Backend Health Check Failing

1. Check if port 8000 is available
2. Verify environment variables are set
3. Check container logs: `docker-compose logs backend`

### Frontend Can't Connect to Backend

1. Ensure backend is healthy first
2. Verify `VITE_API_URL` matches backend URL
3. Check CORS origins include frontend URL

### Permission Errors

```bash
# Fix data directory permissions
sudo chown -R $(id -u):$(id -g) data/ uploads/
```

### Out of Memory

Increase Docker memory limit in Docker Desktop settings (minimum 2GB recommended).

## Resource Usage

Expected resource usage:

| Service | Memory | CPU |
|---------|--------|-----|
| Backend | 256-512MB | 0.25-1.0 |
| Frontend | 32-128MB | 0.1-0.5 |

## Image Sizes

Approximate built image sizes:

| Image | Size |
|-------|------|
| Backend | ~150-200MB |
| Frontend | ~30-50MB |
