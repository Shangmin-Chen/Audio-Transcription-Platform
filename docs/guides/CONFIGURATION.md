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
- Each service supports `.env` files for easy configuration:
  - **Frontend:** `frontend/.env` (read at build/start time)
  - **Backend:** `backend/.env` (read automatically via spring-dotenv)
  - **Python Service:** `python-service/.env` (read automatically via Pydantic Settings)
- Environment variables (set in shell/system) override `.env` file values
- Configuration files serve as documentation of all available options
- Use cleanup script to reset to defaults: `./cleanup-env.sh` (interactive prompts)

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
whisperrr.service.url=${WHISPERRR_SERVICE_URL:http://localhost:5001}
cors.allowed-origins=${CORS_ALLOWED_ORIGINS:http://localhost:3737,http://localhost:3738}
spring.servlet.multipart.max-file-size=50MB
```

**Production Overrides:** `backend/src/main/resources/application-prod.properties`

### Environment File

**Location:** `backend/.env`

**Automatically loaded by Spring Boot via spring-dotenv library.**

**Example:**
```properties
CORS_ALLOWED_ORIGINS=http://192.168.1.100:3737
WHISPERRR_SERVICE_URL=http://192.168.1.100:5001
```

**Reset to Defaults:**
```bash
./cleanup-env.sh
```

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

**Location:** `frontend/.env`

**Automatically read by React at build/start time.**

**Example:**
```properties
REACT_APP_API_URL=http://192.168.1.100:7331/api
REACT_APP_MAX_FILE_SIZE=50  # in MB
```

**⚠️ Important Notes:**
- React reads environment variables **only at dev server start time** (not at runtime)
- The `.env` file **must exist before** running `npm start`
- **You must restart the dev server** after creating or updating `frontend/.env`
- Changes to `.env` files do NOT take effect until you stop and restart `npm start`
- Check browser console for `[API Config]` debug messages to verify which URL is being used

**Troubleshooting:**
If the frontend is still calling localhost instead of your configured URL:
1. Verify `frontend/.env` exists and contains `REACT_APP_API_URL=http://your-host:port/api`
2. **Stop the dev server** (Ctrl+C) and restart it: `npm start`
3. Check browser console - you should see `[API Config]` logs showing the configured URL
4. If you see "REACT_APP_API_URL: (not set)", the `.env` file is not being read - verify file location and restart dev server

**Reset to Defaults:**
```bash
./cleanup-env.sh
```

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

### Environment File

**Location:** `python-service/.env`

**Automatically read by FastAPI/Pydantic Settings at startup.**

**Example:**
```properties
CORS_ORIGINS=http://192.168.1.100:3737,http://192.168.1.100:7331
MODEL_SIZE=base
MAX_FILE_SIZE_MB=50
LOG_LEVEL=INFO
```

**Reset to Defaults:**
```bash
./cleanup-env.sh
```

**Note:** Environment variables (set in shell/system) override `.env` file values. All defaults are defined in `config.py`.

---

## Environment Variables

Each service uses a `.env` file for configuration. The setup script (`setup-env.sh`) automatically generates these files.

### Component-Specific .env Files

**Frontend:** `frontend/.env`
- Read at build/start time by React
- Must exist before running `npm start`

**Backend:** `backend/.env`
- Read automatically by Spring Boot via spring-dotenv
- Loaded at application startup

**Python Service:** `python-service/.env`
- Read automatically by FastAPI/Pydantic Settings
- Loaded at application startup

### Backend Environment Variables

**File:** `backend/.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:3737,http://localhost:3738` |
| `WHISPERRR_SERVICE_URL` | Python service URL | `http://localhost:5001` |

**CORS Configuration:**
- Supports comma-separated list of frontend URLs
- Example: `CORS_ALLOWED_ORIGINS=http://example.com:3737,http://192.168.1.100:3737`
- Supports wildcard (`*`) for dynamic tunnel URLs (e.g., Cloudflare)

### Frontend Environment Variables

**File:** `frontend/.env`

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:7331/api` |
| `REACT_APP_MAX_FILE_SIZE` | Max file size in MB | `50` |

**Note:** Frontend environment variables must be set before `npm start` (React reads env vars at start time, not runtime).

### Python Service Environment Variables

**File:** `python-service/.env`

See [Environment Variables Reference](ENVIRONMENT_VARIABLES.md) for complete list.

**Common variables:**
- `CORS_ORIGINS` - CORS allowed origins (comma-separated list of frontend + backend URLs)
- `MODEL_SIZE` - Whisper model size (default: `base`)
- `MAX_FILE_SIZE_MB` - Max file size in MB (default: `50`)
- `LOG_LEVEL` - Log level (default: `INFO`)
- `SERVER_PORT` - Server port (default: `5001`)

**CORS Configuration:**
- `CORS_ORIGINS` should include both frontend and backend URLs
- Format: comma-separated list (e.g., `http://frontend:3737,http://backend:7331`)
- Example with multiple hosts: `http://example.com:3737,http://192.168.1.100:3737,http://example.com:7331,http://192.168.1.100:7331`

### Cleanup Script

A top-level interactive cleanup script is available to reset services to default localhost configuration:

```bash
./cleanup-env.sh
```

The script will:
- Prompt you for each service (Frontend, Backend, Python Service)
- Ask if you want to delete its `.env` file
- Default answer is "yes" (press Enter to confirm)
- Only prompt for services that have `.env` files

This removes the `.env` files, causing services to use default values from configuration files.

---

## Docker Configuration

### Docker Compose

**File:** `docker-compose.yml`

**Port Mappings:**
- Frontend: `3737:3737`
- Backend: `7331:7331`
- Python Service: `5001:5001`

**Environment Variables:**

Option 1: Use environment variables in docker-compose.yml
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

Option 2: Use .env files (mount them as volumes)
```yaml
services:
  python-service:
    volumes:
      - ./python-service/.env:/app/.env
      
  backend:
    volumes:
      - ./backend/.env:/app/.env
      
  frontend:
    volumes:
      - ./frontend/.env:/app/.env
```

**Note:** Environment variables in docker-compose.yml override `.env` file values.

---

## Multi-Host Configuration (Remote Deployment)

For remote deployment scenarios where you need to configure multiple hosts per service (e.g., domain + IP address), use the setup script's remote deployment mode:

```bash
./setup-env.sh
# When prompted: "Set up for remote deployment? (y/N)", answer "y"
```

### Use Cases

- **Cloudflare Tunnel**: Configure both tunnel domain and direct IP access
- **Multiple Network Interfaces**: Access via different network paths
- **Load Balancing**: Multiple entry points to services
- **Development + Production**: Test with both local and remote URLs

### How It Works

1. The script prompts for multiple hosts per service (Frontend, Backend, Python)
2. For each service, you can add multiple host:port pairs
3. URLs are automatically constructed from host:port pairs
4. CORS is configured with:
   - **Backend**: All frontend URLs (comma-separated)
   - **Python Service**: All frontend URLs + all backend URLs (comma-separated)

### Example Configuration

**Setup Script Output:**
```
Frontend Hosts:
  x.y.com:3737 -> http://x.y.com:3737
  192.168.1.100:3737 -> http://192.168.1.100:3737

Backend Hosts:
  x.y.com:7331 -> http://x.y.com:7331
  192.168.1.100:7331 -> http://192.168.1.100:7331

CORS_ALLOWED_ORIGINS=http://x.y.com:3737,http://192.168.1.100:3737
CORS_ORIGINS=http://x.y.com:3737,http://192.168.1.100:3737,http://x.y.com:7331,http://192.168.1.100:7331
```

### Manual Configuration

If you prefer to create `.env` files manually for multi-host scenarios:

**`backend/.env`:**
```properties
CORS_ALLOWED_ORIGINS=http://example.com:3737,http://192.168.1.100:3737
WHISPERRR_SERVICE_URL=http://example.com:5001
```

**`python-service/.env`:**
```properties
CORS_ORIGINS=http://example.com:3737,http://192.168.1.100:3737,http://example.com:7331,http://192.168.1.100:7331
```

**`frontend/.env`:**
```properties
REACT_APP_API_URL=http://example.com:7331/api
```

**Note:** The setup script (`setup-env.sh`) can generate these files automatically with proper validation.

## Best Practices

### Configuration Management

1. **Use Configuration Files for Defaults:**
   - All defaults should be in configuration files
   - Configuration files serve as documentation

2. **Use .env Files for Overrides:**
   - Override defaults via `.env` files (one per service)
   - Generated automatically by `setup-env.sh`
   - Environment variables (shell/system) override `.env` file values
   - Never hardcode values in code

3. **Use Setup Script for Configuration:**
   - Run `setup-env.sh` to generate `.env` files for all services
   - For remote deployment with multiple hosts, use remote deployment mode
   - The script validates inputs and generates correct CORS configuration

4. **Use Cleanup Script to Reset:**
   - Run `./cleanup-env.sh` for interactive cleanup of any service
   - Prompts for each service with default "yes" answer
   - Useful for switching between localhost and remote configurations

5. **Document All Options:**
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
