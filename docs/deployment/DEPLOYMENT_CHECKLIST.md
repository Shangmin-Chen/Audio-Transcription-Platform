# Deployment Checklist - Docker Optimizations

> ⚠️ **Important Notice**: Docker is **not recommended** for running Whisperrr as it is **slower** and has **lower accuracy** compared to running the services natively. This documentation is provided for reference only if Docker deployment is absolutely necessary.

## Pre-Deployment

- [ ] Review all changes in `DOCKER_OPTIMIZATION_SUMMARY.md`
- [ ] Read detailed documentation in `DOCKER_OPTIMIZATION.md`
- [ ] Understand testing procedures in `TESTING_OPTIMIZATIONS.md`

## Deployment Steps

### 1. Stop Current Services
```bash
cd /Users/shangminchen/Whisperrr
docker compose down
```

### 2. Clean Up (Optional but Recommended)
```bash
# Remove old images to force rebuild
docker compose down --rmi all

# Remove volumes if you want fresh start (will re-download model)
docker compose down -v

# Clean Docker system (careful - affects all containers)
docker system prune -a
```

### 3. Rebuild Services
```bash
# Build without cache to ensure all changes are applied
docker compose build --no-cache

# Expected build time: 5-10 minutes
# - Backend: Maven build (~2 min)
# - Frontend: npm install + build (~2 min)
# - Python: pip install (~1 min)
```

### 4. Start Services
```bash
# Start in detached mode
docker compose up -d

# OR start with logs visible
docker compose up
```

### 5. Monitor Startup (2-3 minutes)
```bash
# Watch all logs
docker compose logs -f

# Watch specific service
docker compose logs -f python-service
```

**Expected Startup Sequence:**
```
0-60s:   Python service starts, loads model
60s:     Python service becomes healthy
60-105s: Backend starts, connects to Python
105s:    Backend becomes healthy  
105-135s: Frontend starts
135s:    All services healthy and ready
```

## Verification Steps

### Step 1: Check Service Health
```bash
docker compose ps
```

**Expected Output:**
```
NAME                 STATUS                    HEALTH
whisperrr-python     Up X seconds (healthy)
whisperrr-backend    Up X seconds (healthy)
whisperrr-frontend   Up X seconds (healthy)
```

- [ ] All services show "healthy" status
- [ ] No services are "unhealthy" or "starting"

### Step 2: Verify Single Worker
```bash
docker compose logs python-service | grep "Started parent process"
```

**Expected Output:**
```
INFO:     Started parent process [16]
```

- [ ] Only ONE "Started parent process" message
- [ ] If you see 4 messages, worker count is wrong

### Step 3: Verify Connection Pooling
```bash
docker compose logs backend | grep "connection pooling"
```

**Expected Output:**
```
RestTemplate initialized with Apache HttpClient connection pooling (max=20, per-route=10)
```

- [ ] Connection pooling message appears
- [ ] Shows max=20, per-route=10

### Step 4: Test Health Endpoints
```bash
# Python Service
curl http://localhost:5001/health

# Backend
curl http://localhost:7331/actuator/health

# Frontend
curl http://localhost:3737
```

- [ ] All endpoints return successful responses
- [ ] Python shows model_loaded: true
- [ ] Backend shows status: UP

### Step 5: Test Job Submission
```bash
# Open browser
open http://localhost:3737

# OR test with curl (replace with your audio file)
curl -X POST http://localhost:7331/api/audio/transcribe/job \
  -F "file=@test_audio.mp3" \
  -F "modelSize=base"
```

**Expected Response:**
```json
{
  "jobId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "status": "PENDING",
  "message": "Job submitted successfully"
}
```

- [ ] Job submission succeeds
- [ ] Receives valid job ID

### Step 6: Test Job Polling
```bash
# Replace JOB_ID with actual ID from previous step
curl http://localhost:7331/api/audio/transcribe/job/JOB_ID/progress
```

**Monitor logs while polling:**
```bash
docker compose logs -f python-service | grep progress
```

- [ ] No 404 "Job not found" errors
- [ ] Progress increases from 0 to 100
- [ ] Status changes: PENDING → PROCESSING → COMPLETED
- [ ] Result appears when status is COMPLETED

### Step 7: Verify Cleanup Task (Wait 5+ minutes)
```bash
docker compose logs python-service | grep cleanup
```

**Expected Output (every 5 minutes):**
```
INFO - Started periodic job cleanup (interval: 300s)
INFO - Completed periodic job cleanup
```

- [ ] Cleanup task starts on startup
- [ ] Periodic cleanup messages appear every 5 minutes

### Step 8: Check Resource Usage
```bash
docker stats --no-stream
```

**Expected Resource Usage:**
```
NAME                CPU %    MEM USAGE / LIMIT    MEM %
whisperrr-python    10-50%   2-4GB / 8GB         25-50%
whisperrr-backend   1-5%     256MB-512MB / 1GB   25-50%
whisperrr-frontend  1-10%    Variable            Variable
```

- [ ] Python service memory: 2-4GB (stable)
- [ ] Backend memory: 256-512MB (stable)
- [ ] CPU usage reasonable (<50% average)

## Full Integration Test

### Test Case: Complete Transcription Workflow

1. **Submit Job**
   ```bash
   JOB_ID=$(curl -s -X POST http://localhost:7331/api/audio/transcribe/job \
     -F "file=@test_audio.mp3" \
     -F "modelSize=base" | jq -r '.jobId')
   echo "Job ID: $JOB_ID"
   ```

2. **Poll Progress (automated)**
   ```bash
   while true; do
     RESPONSE=$(curl -s http://localhost:7331/api/audio/transcribe/job/$JOB_ID/progress)
     STATUS=$(echo $RESPONSE | jq -r '.status')
     PROGRESS=$(echo $RESPONSE | jq -r '.progress')
     echo "Status: $STATUS, Progress: $PROGRESS%"
     
     if [ "$STATUS" = "COMPLETED" ]; then
       echo "✅ Job completed successfully!"
       echo $RESPONSE | jq '.result.transcriptionText'
       break
     elif [ "$STATUS" = "FAILED" ]; then
       echo "❌ Job failed!"
       echo $RESPONSE | jq '.error'
       break
     fi
     
     sleep 2
   done
   ```

3. **Check Logs for Errors**
   ```bash
   docker compose logs python-service | grep -i error
   docker compose logs backend | grep -i error
   ```

**Success Criteria:**
- [ ] Job completes without 404 errors
- [ ] Progress increases smoothly
- [ ] Transcription result returned
- [ ] No errors in logs
- [ ] Polling works consistently

## Troubleshooting

### Issue: Services won't start
```bash
# Check for port conflicts
lsof -i :3737  # Frontend
lsof -i :5001  # Python
lsof -i :7331  # Backend

# Check Docker resources
docker system df
docker system prune  # If needed
```

### Issue: Services unhealthy
```bash
# Check detailed health status
docker inspect whisperrr-python | jq '.[0].State.Health'
docker inspect whisperrr-backend | jq '.[0].State.Health'

# Check logs for specific error
docker compose logs [service-name]
```

### Issue: Still seeing 404 errors
```bash
# Verify worker count
docker compose exec python-service env | grep UVICORN_WORKERS
# Must show: UVICORN_WORKERS=1

# If showing 4, rebuild:
docker compose down
docker compose build python-service --no-cache
docker compose up -d
```

### Issue: Connection pooling not working
```bash
# Verify Apache HttpClient is available
docker compose exec backend java -cp /app/app.jar -version

# Check if httpclient5 is in classpath
docker compose exec backend sh -c "ls /app/libs | grep httpclient"

# If missing, rebuild backend:
docker compose build backend --no-cache
```

### Issue: Jobs not being cleaned up
```bash
# Check if cleanup task is running
docker compose logs python-service | grep "periodic job cleanup"

# If not found, check main.py lifespan function was updated:
docker compose exec python-service cat /app/app/main.py | grep "periodic_cleanup"
```

## Rollback Procedure

If critical issues occur:

```bash
# 1. Stop services
docker compose down

# 2. Restore from git (if committed before changes)
git checkout HEAD~1 -- docker-compose.yml
git checkout HEAD~1 -- backend/
git checkout HEAD~1 -- python-service/
git checkout HEAD~1 -- frontend/

# 3. Rebuild and restart
docker compose build --no-cache
docker compose up -d
```

## Post-Deployment

### Monitor for 24 Hours

- [ ] Check logs periodically for errors
- [ ] Monitor memory usage trends
- [ ] Test multiple transcriptions
- [ ] Verify cleanup runs every 5 minutes
- [ ] Confirm no 404 errors in production use

### Performance Baseline

Record baseline metrics:
```bash
# Average poll latency
time curl http://localhost:7331/api/audio/transcribe/job/test-id/progress

# Memory usage
docker stats --no-stream | grep whisperrr

# Job success rate (over 10 jobs)
# Track: submitted, completed, failed
```

### Documentation Updates

- [ ] Update team wiki with new configuration
- [ ] Share optimization results with team
- [ ] Document any custom modifications
- [ ] Update deployment runbooks

## Success Confirmation

After all checks pass:
- ✅ All services healthy
- ✅ Single worker mode confirmed
- ✅ Connection pooling active
- ✅ Zero 404 errors in job polling
- ✅ Jobs complete successfully (100% rate)
- ✅ Cleanup task running
- ✅ Stable memory usage
- ✅ Fast poll responses (<30ms average)

## Support

If issues persist:
1. Collect diagnostic info:
   ```bash
   docker compose logs > logs.txt
   docker compose ps > ps.txt
   docker stats --no-stream > stats.txt
   docker network inspect whisperrr_whisperrr-network > network.json
   ```

2. Review documentation:
   - `DOCKER_OPTIMIZATION_SUMMARY.md`
   - `DOCKER_OPTIMIZATION.md`
   - `TESTING_OPTIMIZATIONS.md`

3. Check for known issues in git history

---

**Ready to Deploy?**

Ensure all pre-deployment items are checked, then proceed with deployment steps.

Remember: The critical fix is single-worker mode. Everything else enhances it.

Good luck! 🚀
