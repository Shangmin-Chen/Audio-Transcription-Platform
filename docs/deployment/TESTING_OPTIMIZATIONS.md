# Testing Docker Optimizations

> ⚠️ **Important Notice**: Docker is **not recommended** for running Whisperrr as it is **slower** and has **lower accuracy** compared to running the services natively. This documentation is provided for reference only if Docker deployment is absolutely necessary.

## Quick Verification Steps

### 1. Rebuild and Restart Services
```bash
# Stop existing containers
docker compose down

# Rebuild with new configurations
docker compose build --no-cache

# Start services
docker compose up -d

# Watch logs for all services
docker compose logs -f
```

### 2. Verify Health Checks
```bash
# Check all service statuses
docker compose ps

# Expected output:
# NAME                 STATUS                    HEALTH
# whisperrr-python     Up X seconds (healthy)
# whisperrr-backend    Up X seconds (healthy)
# whisperrr-frontend   Up X seconds (healthy)

# If any service is unhealthy, check logs:
docker compose logs [service-name]
```

### 3. Verify Single Worker Mode
```bash
# Check Python service logs
docker compose logs python-service | grep "Started parent process"

# Expected: Should see ONLY ONE "Started parent process" line
# Before optimization: Would see 4 lines (one per worker)
```

### 4. Verify Connection Pooling
```bash
# Check backend logs for connection pool initialization
docker compose logs backend | grep "connection pooling"

# Expected output:
# RestTemplate initialized with Apache HttpClient connection pooling (max=20, per-route=10)
```

### 5. Test Job Submission and Polling
```bash
# Upload a test audio file via the frontend at http://localhost:3737
# OR use curl:

# Submit job
curl -X POST http://localhost:7331/api/audio/transcribe/job \
  -F "file=@test_audio.mp3" \
  -F "modelSize=base"

# Expected response:
{
  "jobId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "status": "PENDING",
  "message": "Job submitted successfully"
}

# Poll job progress (replace JOB_ID)
curl http://localhost:7331/api/audio/transcribe/job/JOB_ID/progress

# Expected: NO 404 errors, consistent responses
```

### 6. Monitor Polling Behavior
```bash
# Watch Python service logs during job processing
docker compose logs -f python-service

# Expected behavior:
# ✅ All progress requests should return 200 OK
# ✅ NO 404 Not Found errors
# ✅ Progress increases from 0 to 100
# ✅ Job completes successfully

# Before optimization:
# ❌ Intermittent 404 errors
# ❌ Job appears to disappear mid-processing
# ❌ Polling fails and stops
```

### 7. Verify Automatic Cleanup
```bash
# Check logs for cleanup messages (wait 5+ minutes after job completion)
docker compose logs python-service | grep "cleanup"

# Expected output every 5 minutes:
# INFO - Started periodic job cleanup (interval: 300s)
# INFO - Completed periodic job cleanup
```

### 8. Performance Testing

#### Test 1: Short Audio File (< 1 minute)
```bash
# Expected completion time: < 30 seconds
# Expected polling requests: 10-20
# Expected success rate: 100%
```

#### Test 2: Medium Audio File (1-5 minutes)
```bash
# Expected completion time: 1-3 minutes
# Expected polling requests: 30-90
# Expected success rate: 100%
```

#### Test 3: Long Audio File (> 5 minutes)
```bash
# Expected completion time: 3-10 minutes
# Expected polling requests: 90-300
# Expected success rate: 100%
```

### 9. Connection Pool Efficiency Test
```bash
# Submit multiple jobs in sequence (NOT parallel - single worker)
for i in {1..3}; do
  echo "Submitting job $i"
  curl -X POST http://localhost:7331/api/audio/transcribe/job \
    -F "file=@test_audio.mp3" \
    -F "modelSize=base"
  sleep 5
done

# Check backend logs for connection reuse
docker compose logs backend | grep -i "connection"

# Expected: Connection pool should reuse existing connections
# Should NOT see many "establishing connection" messages
```

### 10. Memory Stability Test
```bash
# Monitor memory usage over time
watch -n 5 'docker stats --no-stream --format "table {{.Name}}\t{{.MemUsage}}\t{{.MemPerc}}"'

# Expected:
# - Python service: Stable memory (2-4GB after model load)
# - Backend: Stable memory (256MB-512MB)
# - Frontend: Stable memory (varies)

# After multiple jobs, memory should NOT continuously grow
# Cleanup task should keep memory stable
```

## Common Issues and Solutions

### Issue: Service shows as "unhealthy"
```bash
# Check detailed health status
docker inspect whisperrr-python | jq '.[0].State.Health'

# Common causes:
# 1. Model not loaded yet (wait 60s for start_period)
# 2. Port not accessible (check firewall)
# 3. Service crashed (check logs)

# Solution:
docker compose logs [service-name]
```

### Issue: Backend can't connect to Python service
```bash
# Check if services are on same network
docker network inspect whisperrr_whisperrr-network

# Verify both containers are listed
# Verify python-service has IP address

# Test connectivity
docker exec whisperrr-backend curl -f http://python-service:5001/health

# Expected: {"status":"healthy",...}
```

### Issue: Frontend can't reach backend
```bash
# Check backend is accessible from host
curl http://localhost:7331/actuator/health

# Check browser console for CORS errors
# Verify REACT_APP_API_URL is set correctly in frontend container:
docker exec whisperrr-frontend env | grep REACT_APP_API_URL
```

### Issue: Still seeing 404 errors
```bash
# Verify single worker mode
docker compose exec python-service ps aux | grep uvicorn

# Should show ONLY ONE uvicorn worker process
# If multiple workers: Check UVICORN_WORKERS env var
docker compose exec python-service env | grep UVICORN_WORKERS

# Expected: UVICORN_WORKERS=1
```

## Success Criteria

After all tests, you should observe:

- ✅ **Zero 404 errors** during job polling
- ✅ **100% job completion rate** for valid audio files
- ✅ **Stable memory usage** over time
- ✅ **Fast polling responses** (< 30ms average)
- ✅ **Proper startup sequence** (python → backend → frontend)
- ✅ **Connection pooling active** in backend logs
- ✅ **Periodic cleanup running** every 5 minutes
- ✅ **Health checks passing** for all services

## Benchmarking Commands

### Measure Poll Request Latency
```bash
# Time 10 poll requests
for i in {1..10}; do
  time curl -s http://localhost:7331/api/audio/transcribe/job/test-id/progress -o /dev/null
done | grep real

# Expected average: < 50ms with connection pooling
```

### Measure Job Completion Time
```bash
START=$(date +%s)

# Submit job
JOB_ID=$(curl -s -X POST http://localhost:7331/api/audio/transcribe/job \
  -F "file=@test_audio.mp3" \
  -F "modelSize=base" | jq -r '.jobId')

# Poll until complete
while true; do
  STATUS=$(curl -s http://localhost:7331/api/audio/transcribe/job/$JOB_ID/progress | jq -r '.status')
  if [ "$STATUS" = "COMPLETED" ]; then
    break
  fi
  sleep 2
done

END=$(date +%s)
echo "Job completed in $((END-START)) seconds"
```

### Monitor Docker Network Traffic
```bash
# Monitor packets on Docker network
sudo tcpdump -i whisperrr0 -n

# Should see:
# - HTTP requests/responses
# - Connection reuse (same TCP stream)
# - Proper keepalive
```

## Automated Test Script

Create `test_optimizations.sh`:

```bash
#!/bin/bash

echo "=== Docker Optimization Tests ==="

# Test 1: Single Worker
echo -n "Test 1: Single Worker Mode... "
WORKERS=$(docker compose exec python-service ps aux | grep -c "uvicorn worker")
if [ "$WORKERS" -eq 1 ]; then
  echo "✅ PASS"
else
  echo "❌ FAIL (found $WORKERS workers)"
fi

# Test 2: Health Checks
echo -n "Test 2: All Services Healthy... "
HEALTHY=$(docker compose ps --format json | jq -r '.Health' | grep -c "healthy")
if [ "$HEALTHY" -eq 3 ]; then
  echo "✅ PASS"
else
  echo "❌ FAIL (only $HEALTHY/3 healthy)"
fi

# Test 3: Connection Pooling
echo -n "Test 3: Connection Pooling Enabled... "
if docker compose logs backend | grep -q "connection pooling"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
fi

# Test 4: Cleanup Task
echo -n "Test 4: Periodic Cleanup Running... "
if docker compose logs python-service | grep -q "periodic job cleanup"; then
  echo "✅ PASS"
else
  echo "⚠️  WARNING (may need to wait 5+ minutes)"
fi

echo "=== Tests Complete ==="
```

Run with:
```bash
chmod +x test_optimizations.sh
./test_optimizations.sh
```

## Rollback Plan

If issues occur, rollback to previous configuration:

```bash
# Stop services
docker compose down

# Restore from git
git checkout HEAD -- docker-compose.yml backend/ python-service/ frontend/

# Restart
docker compose up -d
```

Or set UVICORN_WORKERS back to 4 and use local development:
```bash
# In docker-compose.yml
UVICORN_WORKERS=4  # Only works for /transcribe endpoint (not /jobs)
```

## Next Steps

After verifying optimizations:

1. **Production Deployment**: Apply same changes to production docker-compose
2. **Monitoring Setup**: Add Prometheus/Grafana for metrics
3. **Load Testing**: Test with concurrent users
4. **Scaling Plan**: Consider Redis for multi-worker support
5. **Documentation**: Update team wiki with new configuration

## Support

If issues persist after testing:

1. Collect logs: `docker compose logs > debug.log`
2. Check container stats: `docker stats > stats.txt`
3. Review network: `docker network inspect whisperrr_whisperrr-network > network.json`
4. Share diagnostic files for investigation

---

**Remember**: The key optimization is single-worker mode. Everything else enhances performance, but worker mode fixes the 404 errors.
