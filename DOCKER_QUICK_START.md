# 🐳 Docker Quick Start

## 📋 Prerequisites

- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose (included in Docker Desktop)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Setup Environment Variables

```bash
cd english_pronunciation_app
copy .env.docker .env
```

**IMPORTANT**: Open `.env` and change `AUTH_SECRET`:

```bash
# Generate a secure secret (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))

# Or use online generator: https://generate-secret.vercel.app/32
```

### Step 2: Build & Run

```bash
docker-compose up --build
```

Wait for:
```
✓ pronunciation_db       Started
✓ pronunciation_backend  Started  
✓ pronunciation_frontend Started
```

### Step 3: Initialize Database

Open a new terminal:

```bash
# Run Prisma migrations
docker exec pronunciation_frontend npx prisma migrate deploy

# Seed database
docker exec pronunciation_frontend npm run db:seed:lessons
docker exec pronunciation_frontend npx tsx prisma/seed_audio_local.ts
docker exec pronunciation_frontend npx tsx prisma/seed_listen_choose_audio.ts
docker exec pronunciation_frontend npx tsx prisma/seed_demo_user.ts
```

---

## ✅ Access Application

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Database**: localhost:5432

**Demo Accounts**:
- Basic: `demo@pronunciation.app` / `Demo1234!`
- Power User (100% complete): `expert@pronunciation.app` / `Expert1234!`

---

## 🛠️ Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Frontend only
docker-compose logs -f frontend

# Database only
docker-compose logs -f db
```

### Rebuild After Code Changes
```bash
docker-compose up --build
```

### Clean Everything (including data)
```bash
docker-compose down -v
docker system prune -a
```

### Database Shell
```bash
docker exec -it pronunciation_db psql -U postgres -d english_app
```

### Frontend Shell
```bash
docker exec -it pronunciation_frontend sh
```

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Change ports in .env:
FRONTEND_PORT=3001
BACKEND_PORT=8001
POSTGRES_PORT=5433
```

### Database Connection Error
```bash
# Check database is healthy:
docker-compose ps

# Restart database:
docker-compose restart db
```

### Frontend Build Fails
```bash
# Check Next.js config allows standalone:
# frontend/next.config.mjs should have:
# output: 'standalone'

# Clean and rebuild:
docker-compose down
docker-compose up --build
```

### Prisma Client Not Generated
```bash
docker exec pronunciation_frontend npx prisma generate
```

---

## 📦 Production Deployment

### 1. Update Environment Variables
```bash
# Production .env:
AUTH_SECRET=<generate-new-secure-secret>
AUTH_URL=https://yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
POSTGRES_PASSWORD=<strong-password>
```

### 2. Use Docker Registry
```bash
# Build and tag:
docker build -t yourusername/pronunciation-frontend:latest ./frontend
docker build -t yourusername/pronunciation-backend:latest ./backend

# Push to registry:
docker push yourusername/pronunciation-frontend:latest
docker push yourusername/pronunciation-backend:latest
```

### 3. Deploy to Cloud
- **AWS ECS**: Use `docker-compose.yml` with ECS CLI
- **Google Cloud Run**: Deploy containers separately
- **Azure Container Instances**: Use Docker Compose integration
- **DigitalOcean App Platform**: Connect GitHub repo with Dockerfile

---

## 🎯 Performance Tips

1. **Multi-stage builds**: Already optimized in Dockerfiles
2. **Layer caching**: Dependencies installed separately from code
3. **Health checks**: Database waits before frontend starts
4. **Volume mounts**: Audio files mounted read-only
5. **Restart policy**: `unless-stopped` for auto-recovery

---

## 📊 Resource Usage

Estimated resources (idle state):
- Frontend: ~150MB RAM
- Backend: ~80MB RAM
- Database: ~50MB RAM
- **Total**: ~300MB RAM, 2GB disk

---

## 🔒 Security Notes

- Change `AUTH_SECRET` before production
- Use strong `POSTGRES_PASSWORD`
- Don't commit `.env` to git (already in `.gitignore`)
- Use HTTPS in production (configure reverse proxy like Nginx)
- Regularly update base images: `docker-compose pull`

---

## 📝 Notes

- Audio files are **included in build** (offline-first architecture)
- Frontend uses **standalone mode** for smaller image size
- Backend is **minimal** (only health check endpoint)
- Database uses **Alpine Linux** for smaller image

---

**Need help?** Check logs: `docker-compose logs -f`
