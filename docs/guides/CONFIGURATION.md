# Configuration Guide

**Purpose:** Complete guide for configuring all Whisperrr services  
**Audience:** Developers, DevOps, System Administrators  
**Last Updated:** 2024-01-15  
**Related Docs:** [Environment Variables](ENVIRONMENT_VARIABLES.md), [Deployment Guide](DEPLOYMENT.md)

---

## Table of Contents

1. [Overview](#overview)
2. [Configuration Philosophy](#configuration-philosophy)
3. [Backend Configuration](#backend-configuration)
4. [Frontend Configuration](#frontend-configuration)
5. [Python Service Configuration](#python-service-configuration)
6. [Environment Variables](#environment-variables)
7. [Docker Configuration](#docker-configuration)
8. [Best Practices](#best-practices)

---

## Overview

Whisperrr uses a centralized configuration approach where each service has a single source of truth for defaults, with environment variables providing overrides. This guide covers configuration for all three services.

---

## Configuration Philosophy

### Single Source of Truth

Each service defines all defaults in a central configuration file:
- **Backend:** `backend/src/main/java/com/shangmin/whisperrr/config/AppConfig.java`
- **Frontend:** `frontend/src/utils/constants.ts`
- **Python Service:** `python-service/app/config.py`

### Environment Variable Overrides

- Environment variables can override defaults
- No `.env` file support (Python service explicitly doesn't read `.env` files)
- Configuration files serve as documentation of all available options

---

## Backend Configuration

### Configuration File

**Location:** `backend/src/main/java/com/shangmin/whisperrr/config/AppConfig.java`

**Contains:**
- `MAX_FILE_SIZE_BYTES` - Maximum file size (50MB)
- `MAX_FILE_SIZE_MB` - Maximum file size in MB
- `PYTHON_SERVICE_CONNECT_TIMEOUT_MS` - Connection timeout (5 seconds)
- `SUPPORTED_EXTENSIONS` - List of supported file extensions
- `AUDIO_EXTENSIONS` - Audio-only extensions
- `VIDEO_EXTENSIONS` - Video extensions
- `MULTIPART_FILE_SIZE_THRESHOLD` - File size threshold for multipart uploads

**Usage:**
```java
import com.shangmin.whisperrr.config.AppConfig;

// Use config values
if (fileSize > AppConfig.MAX_FILE_SIZE_BYTES) {
    // Handle error
}
```

### Application Properties

**Location:** `backend/src/main/resources/application.properties`

**Key Settings:**
```properties
server.port=7331
whisperrr.service.url=http://localhost:5001
cors.allowed-origins=http://localhost:3737,http://localhost:3738
spring.servlet.multipart.max-file-size=50MB
```

**Production Overrides:** `backend/src/main/resources/application-prod.properties`

---

## Frontend Configuration

### Configuration File

**Location:** `frontend/src/utils/constants.ts`

**Contains:**
- `APP_CONFIG` - Application metadata and file size limits
- `TRANSCRIPTION_CONFIG` - Polling intervals and max attempts
- `API_CONFIG` - API base URL and timeout settings
- `UPLOAD_CONFIG` - Upload-related constants
- `UI_CONFIG` - UI-related constants
- `FILE_SIZE_CONFIG` - File size formatting constants

**Usage:**
```typescript
import { TRANSCRIPTION_CONFIG, API_CONFIG, UI_CONFIG } from '../utils/constants';

// Use config values
const pollInterval = TRANSCRIPTION_CONFIG.POLL_INTERVAL_MS;
const timeout = UI_CONFIG.COPY_FEEDBACK_TIMEOUT_MS;
```

### Environment Variables

**Build-time variables:**
```bash
REACT_APP_API_URL=http://localhost:7331/api
REACT_APP_MAX_FILE_SIZE=50  # in MB
```

**Note:** These must be set at build time, not runtime.

---

## Python Service Configuration

### Configuration File

**Location:** `python-service/app/config.py`

**Contains:**
- Model configuration (`model_size`, `max_file_size_mb`)
- Transcription settings (`beam_size`, `default_task`, `target_sample_rate`)
- FFmpeg/FFprobe timeouts
- Progress calculation constants
- Job management settings
- Server configuration (`server_host`, `server_port`)
- Model descriptions and supported languages

**Usage:**
```python
from .config import settings

# Use config values
beam_size = settings.beam_size
timeout = settings.ffmpeg_conversion_timeout_seconds
```

### Important Note

⚠️ **The Python service does NOT use `.env` files.** All defaults are defined in `config.py`. Environment variables can override defaults, but they must be set directly in your environment (via shell export, Docker, or deployment configuration), **not** via a `.env` file.

---

## Environment Variables

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_PORT` | Server port | `7331` |
| `WHISPERRR_SERVICE_URL` | Python service URL | `http://python-service:5001` |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:3737,http://localhost:3738` |

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:7331/api` |
| `REACT_APP_MAX_FILE_SIZE` | Max file size in MB | `50` |

**Note:** Frontend environment variables must be set at build time.

### Python Service Environment Variables

See [Environment Variables Reference](ENVIRONMENT_VARIABLES.md) for complete list.

**Common variables:**
- `MODEL_SIZE` - Whisper model size (default: `base`)
- `MAX_FILE_SIZE_MB` - Max file size in MB (default: `50`)
- `CORS_ORIGINS` - CORS allowed origins
- `LOG_LEVEL` - Log level (default: `INFO`)
- `SERVER_PORT` - Server port (default: `5001`)

---

## Docker Configuration

### Docker Compose

**File:** `docker-compose.yml`

**Port Mappings:**
- Frontend: `3737:3737`
- Backend: `7331:7331`
- Python Service: `5001:5001`

**Environment Variables:**
```yaml
services:
  python-service:
    environment:
      - CORS_ORIGINS=http://localhost:7331,http://localhost:3737
      
  backend:
    environment:
      - WHISPERRR_SERVICE_URL=http://python-service:5001
      - CORS_ALLOWED_ORIGINS=http://localhost:3737,http://localhost:3738
      
  frontend:
    environment:
      - REACT_APP_API_URL=http://localhost:7331/api
```

---

## Best Practices

### Configuration Management

1. **Use Configuration Files for Defaults:**
   - All defaults should be in configuration files
   - Configuration files serve as documentation

2. **Use Environment Variables for Overrides:**
   - Override defaults via environment variables
   - Never hardcode values in code

3. **Document All Options:**
   - Keep configuration files well-documented
   - Update this guide when adding new options

### Security Considerations

- Never commit secrets to configuration files
- Use environment variables for sensitive data
- Validate configuration on startup

### Environment-Specific Configuration

- **Development:** Use defaults from configuration files
- **Production:** Override via environment variables
- **Testing:** Use test-specific overrides

---

## Files Updated

### Backend
- `AudioServiceImpl.java` - Uses `AppConfig` for file size limits and supported extensions

### Python Service
- `whisper_service.py` - Uses config for beam size, task type, progress calculations
- `utils.py` - Uses config for sample rate, audio channels, and timeouts
- `job_manager.py` - Uses config for job cleanup max age
- `main.py` - Uses config for server settings and task type

### Frontend
- `useTranscription.ts` - Uses `TRANSCRIPTION_CONFIG` for polling settings
- `api.ts` - Uses `API_CONFIG` for base URL and timeout
- `fileValidation.ts` - Uses `FILE_SIZE_CONFIG` for formatting constants
- `useFileUpload.ts` - Uses `UPLOAD_CONFIG` for max files
- `ResultsView.tsx` - Uses `UI_CONFIG` for copy feedback timeout

---

## Benefits

1. **Single Source of Truth:** All configuration values defined in one place per service
2. **Easy Updates:** Change a value once and it applies everywhere
3. **Environment Overrides:** Support for environment variable overrides
4. **Type Safety:** TypeScript and Java provide compile-time type checking
5. **Documentation:** Config files serve as documentation of all configurable values
6. **Maintainability:** Easier to understand and modify application behavior

---

## See Also

- [Environment Variables Reference](ENVIRONMENT_VARIABLES.md) - Detailed Python service environment variables
- [Deployment Guide](DEPLOYMENT.md) - Production deployment configuration
- [Architecture Documentation](../architecture/ARCHITECTURE.md) - System architecture overview
- [Main Documentation Index](../README.md)
