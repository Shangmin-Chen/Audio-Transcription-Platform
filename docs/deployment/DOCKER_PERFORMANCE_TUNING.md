# Docker Performance Tuning Guide

> ⚠️ **Important Notice**: Docker is **not recommended** for running Whisperrr as it is **slower** and has **lower accuracy** compared to running the services natively. This documentation is provided for reference only if Docker deployment is absolutely necessary.

## Why Docker is Slower Than Local (Especially on macOS)

### The Core Problem

On **macOS**, Docker Desktop runs Linux containers inside a **Lightweight VM**, which creates several performance bottlenecks:

```
Your App → Docker Desktop VM → Linux Container → Your Code
         ↑ Overhead        ↑ Overhead        ↑ File I/O overhead
```

**Impact on Whisper transcription:**
- 20-50% slower CPU performance
- 10-50x slower file I/O (especially with volume mounts)
- 2-5ms network latency between containers

## Performance Comparison

| Metric | Local (Native) | Docker (Development) | Docker (Production) |
|--------|----------------|---------------------|---------------------|
| CPU Performance | 100% | 50-80% | 70-90% |
| File I/O | 100% | 2-10% (osxfs) | 80-90% (no mounts) |
| Memory Access | 100% | 90-95% | 90-95% |
| Network Latency | <1ms | 2-5ms | 2-5ms |
| **Overall Speed** | **100%** | **30-60%** | **70-85%** |

## 🚀 Optimization Strategies

### Level 1: Quick Wins (5 minutes)

#### 1. Use Production Compose File (NO volume mounts)

```bash
# Current (development mode with volume mounts)
docker compose up                                    # SLOW ⚠️

# Optimized (production mode without volume mounts)
docker compose -f docker-compose.prod.yml up        # FAST ✓
```

**Why it helps:** Eliminates osxfs/VirtioFS overhead for file operations.

**Trade-off:** Need to rebuild image after code changes.

#### 2. Enable VirtioFS in Docker Desktop

```bash
# Open Docker Desktop
open -a Docker

# Settings → General → Enable VirtioFS
# ✓ Use the new Virtualization framework
# ✓ VirtioFS

# Restart Docker Desktop
```

**Improvement:** 2-3x faster file I/O compared to legacy osxfs.

#### 3. Increase Docker Desktop Resources

```bash
# Settings → Resources
CPUs: 8 (or max available - 2)
Memory: 12GB (or more)
Swap: 2GB
Disk: 100GB
```

**Current limits in docker-compose.yml:**
- Python: 4 CPUs, 8GB RAM
- Backend: 1 CPU, 1GB RAM

**Note:** Docker Desktop allocation must be HIGHER than container limits.

### Level 2: Configuration Optimizations (15 minutes)

#### 1. Optimize Shared Memory

```yaml
python-service:
  shm_size: '4gb'  # Increase from 2gb
```

**Why:** Whisper model operations use shared memory. More = faster.

#### 2. Use tmpfs for Temp Files

Add to `docker-compose.prod.yml`:

```yaml
python-service:
  tmpfs:
    - /tmp/whisperrr_uploads:size=2G,mode=1777
```

**Why:** tmpfs stores files in RAM (fast) instead of disk (slow via osxfs).

#### 3. Optimize Thread Configuration

```yaml
python-service:
  environment:
    # Match your CPU count
    - OMP_NUM_THREADS=8        # Increase from 4
    - MKL_NUM_THREADS=8        # Increase from 4
    - NUMEXPR_NUM_THREADS=8    # Add this
```

**Rule:** Set to number of CPUs allocated to container.

#### 4. Enable BuildKit

```bash
# Add to ~/.docker/config.json or set env var
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Faster builds
docker compose build
```

### Level 3: Advanced Optimizations (30 minutes)

#### 1. Use Native Python (Best Performance)

**Skip Docker entirely for Python service:**

```bash
# Install dependencies locally
cd python-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run directly
cd app
uvicorn main:app --host 0.0.0.0 --port 5001

# Keep backend/frontend in Docker
docker compose up backend frontend
```

**Performance:** 100% native speed, no Docker overhead.

#### 2. Enable Docker Desktop Rosetta (Apple Silicon only)

If on M1/M2/M3 Mac:

```bash
# Settings → Features in development
# ✓ Use Rosetta for x86/amd64 emulation

# Restart Docker
```

**Why:** Faster x86 emulation if using x86 images.

#### 3. Use Local Build Cache

```yaml
# In Dockerfile
FROM python:3.12-slim

# Add build cache mount
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --no-cache-dir -r requirements.txt
```

**Benefit:** Faster rebuilds (keeps pip cache between builds).

#### 4. Optimize Python Image

Use Alpine Linux (smaller, faster):

```dockerfile
# Instead of python:3.12-slim
FROM python:3.12-alpine

# Install only required dependencies
RUN apk add --no-cache curl ffmpeg
```

**Trade-off:** Some Python packages may have compatibility issues.

### Level 4: macOS-Specific Optimizations

#### 1. Disable Docker Desktop Background Services

```bash
# Reduce Docker Desktop overhead
# Settings → General
# ✓ Start Docker Desktop when you log in (disable if not needed)
```

#### 2. Use Docker Contexts

```bash
# If you have access to a Linux machine/VM
docker context create remote --docker "host=ssh://user@remote-machine"
docker context use remote

# Now commands run on remote (faster) machine
docker compose up
```

#### 3. Use Colima (Docker Desktop Alternative)

```bash
# Install Colima (lightweight Docker runtime)
brew install colima

# Start with more resources
colima start --cpu 8 --memory 12 --disk 100

# Use existing docker commands
docker compose up
```

**Benefit:** Often faster than Docker Desktop on macOS.

## 📊 Performance Testing

### Measure Current Performance

```bash
# Test transcription speed
time docker compose exec python-service python3 -c "
import time
from app.whisper_service import whisper_service
# Run test transcription
"

# Check resource usage
docker stats --no-stream
```

### Benchmark: Local vs Docker

**Test Script:**

```bash
#!/bin/bash
echo "=== Performance Benchmark ==="

# Test 1: Docker (development)
echo "Test 1: Docker Development Mode"
time docker compose exec python-service curl -X POST http://localhost:5001/transcribe \
  -F "file=@test_audio.mp3" > /dev/null

# Test 2: Docker (production)
echo "Test 2: Docker Production Mode"
time docker compose -f docker-compose.prod.yml exec python-service curl -X POST http://localhost:5001/transcribe \
  -F "file=@test_audio.mp3" > /dev/null

# Test 3: Local (if running natively)
echo "Test 3: Local Native"
time curl -X POST http://localhost:5001/transcribe \
  -F "file=@test_audio.mp3" > /dev/null
```

## 🎯 Recommended Configuration

### For Development (Hot Reload)
```bash
# Use docker-compose.yml (current)
# Accept slower performance for convenience
docker compose up
```

### For Performance Testing
```bash
# Use production compose (no volume mounts)
docker compose -f docker-compose.prod.yml up
```

### For Maximum Performance
```bash
# Run Python service locally
cd python-service
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 5001

# Keep backend/frontend in Docker (they're fast)
docker compose up backend frontend
```

## 🔧 Quick Commands

### Switch to Production Mode

```bash
# Stop development
docker compose down

# Start production (no volume mounts)
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### Check Docker Resource Usage

```bash
# Real-time stats
docker stats

# Container limits
docker inspect whisperrr-python | jq '.[0].HostConfig.Memory'
docker inspect whisperrr-python | jq '.[0].HostConfig.NanoCpus'
```

### Monitor File I/O Performance

```bash
# Watch disk operations
docker stats --format "table {{.Container}}\t{{.BlockIO}}"

# With volume mounts: High BlockIO = slow
# Without volume mounts: Low BlockIO = fast
```

## 📈 Expected Improvements

| Optimization | Speed Improvement | Effort |
|-------------|-------------------|--------|
| Remove volume mounts | +40-60% | 5 min |
| Enable VirtioFS | +50-100% (I/O) | 2 min |
| Increase resources | +20-30% | 5 min |
| Use tmpfs | +30-50% (I/O) | 10 min |
| Run Python locally | +50-100% | 15 min |
| Use Colima | +20-40% | 30 min |

**Cumulative:** Can achieve **80-90% of native performance** with all optimizations.

## 🎓 Understanding the Trade-offs

### Development Mode (docker-compose.yml)
**Pros:**
- ✓ Hot reload (code changes apply immediately)
- ✓ Easy debugging
- ✓ Consistent environment

**Cons:**
- ✗ 30-60% of native speed
- ✗ High file I/O overhead
- ✗ Slower transcription

### Production Mode (docker-compose.prod.yml)
**Pros:**
- ✓ 70-85% of native speed
- ✓ No file I/O overhead
- ✓ True production testing

**Cons:**
- ✗ Must rebuild after code changes
- ✗ No hot reload
- ✗ Slower development iteration

### Hybrid Mode (Python local, rest Docker)
**Pros:**
- ✓ 95-100% speed for Python/Whisper (most important)
- ✓ Hot reload for Python
- ✓ Backend/Frontend still containerized

**Cons:**
- ✗ More complex setup
- ✗ Python environment on host
- ✗ Different from production

## 🚨 Common Mistakes

### ❌ Mistake 1: Too Many Volume Mounts
```yaml
volumes:
  - ./python-service:/app              # ENTIRE directory
  - ./python-service/app:/app/app      # Nested mount
```
**Fix:** Mount only what you need, or remove in production.

### ❌ Mistake 2: Docker Desktop Too Small
```
Docker Desktop: 4GB RAM, 2 CPUs
Container limit: 8GB RAM, 4 CPUs  # Can't allocate more than available!
```
**Fix:** Docker Desktop must be larger than container limits.

### ❌ Mistake 3: Using osxfs (Old File System)
```bash
# Check your file sharing implementation
docker info | grep "Cgroup Version"
```
**Fix:** Enable VirtioFS in Docker Desktop settings.

### ❌ Mistake 4: Not Using Production Mode
```bash
# Testing performance with volume mounts
docker compose up  # 30-60% speed ❌
```
**Fix:** Use production compose for benchmarks.

## 💡 Summary

**Why Docker is slower:**
1. VM overhead on macOS (20-50% CPU penalty)
2. File system translation (10-50x slower I/O)
3. Network virtualization (2-5ms per hop)
4. Resource limits

**Quick wins:**
1. Use `docker-compose.prod.yml` (no volume mounts)
2. Enable VirtioFS in Docker Desktop
3. Increase Docker Desktop resources
4. Or run Python service locally (best performance)

**Bottom line:** Docker will **always be slower than native** on macOS, but you can get close (70-90% speed) with optimizations. For maximum performance during development, run Python locally and keep backend/frontend in Docker.

---

**Next Steps:**
1. Try production compose: `docker compose -f docker-compose.prod.yml up`
2. Measure improvement
3. Decide if trade-offs are acceptable
4. Consider hybrid approach for best of both worlds
