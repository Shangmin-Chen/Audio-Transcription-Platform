# Configuration Centralization

This document describes the centralization of all hardcoded values into configuration files.

## Overview

All hardcoded values throughout the codebase have been moved to centralized configuration files for better maintainability and consistency. This allows for easier updates and environment-specific overrides.

## Configuration Files

### Backend (Java)
**File:** `backend/src/main/java/com/shangmin/whisperrr/config/AppConfig.java`

**Contains:**
- `MAX_FILE_SIZE_BYTES` - Maximum file size (1GB)
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

### Python Service
**File:** `python-service/app/config.py`

**Contains:**
- File size limits (`max_file_size_mb`, `max_file_size_bytes`)
- Transcription settings (`beam_size`, `default_task`, `target_sample_rate`, `audio_channels`)
- FFmpeg/FFprobe timeouts (`ffprobe_timeout_seconds`, `ffmpeg_conversion_timeout_seconds`)
- Progress calculation constants (`preprocessing_progress_max`, `transcription_progress_min`, etc.)
- Job management (`job_cleanup_max_age_seconds`)
- Server configuration (`server_host`, `server_port`, `server_reload`)
- Model descriptions and supported languages dictionaries

**Usage:**
```python
from .config import settings

# Use config values
beam_size = settings.beam_size
timeout = settings.ffmpeg_conversion_timeout_seconds
```

### Frontend (TypeScript/React)
**File:** `frontend/src/utils/constants.ts`

**Contains:**
- `APP_CONFIG` - Application metadata and file size limits
- `TRANSCRIPTION_CONFIG` - Polling intervals and max attempts
- `API_CONFIG` - API base URL and timeout settings
- `UPLOAD_CONFIG` - Upload-related constants
- `UI_CONFIG` - UI-related constants (copy feedback timeout)
- `FILE_SIZE_CONFIG` - File size formatting constants

**Usage:**
```typescript
import { TRANSCRIPTION_CONFIG, API_CONFIG, UI_CONFIG } from '../utils/constants';

// Use config values
const pollInterval = TRANSCRIPTION_CONFIG.POLL_INTERVAL_MS;
const timeout = UI_CONFIG.COPY_FEEDBACK_TIMEOUT_MS;
```

## Files Updated

### Backend
- `AudioServiceImpl.java` - Now uses `AppConfig` for file size limits and supported extensions

### Python Service
- `whisper_service.py` - Uses config for beam size, task type, progress calculations, model descriptions, and languages
- `utils.py` - Uses config for sample rate, audio channels, and timeouts
- `job_manager.py` - Uses config for job cleanup max age
- `main.py` - Uses config for server settings and task type

### Frontend
- `useTranscription.ts` - Uses `TRANSCRIPTION_CONFIG` for polling settings
- `api.ts` - Uses `API_CONFIG` for base URL and timeout
- `fileValidation.ts` - Uses `FILE_SIZE_CONFIG` for formatting constants
- `useFileUpload.ts` - Uses `UPLOAD_CONFIG` for max files
- `ResultsView.tsx` - Uses `UI_CONFIG` for copy feedback timeout

## Benefits

1. **Single Source of Truth:** All configuration values are defined in one place per service
2. **Easy Updates:** Change a value once and it applies everywhere
3. **Environment Overrides:** Python and Frontend configs support environment variable overrides
4. **Type Safety:** TypeScript and Java provide compile-time type checking
5. **Documentation:** Config files serve as documentation of all configurable values
6. **Maintainability:** Easier to understand and modify application behavior

## Environment Variable Overrides

### Python Service
All settings in `config.py` can be overridden via environment variables:
```bash
export MODEL_SIZE=large
export MAX_FILE_SIZE_MB=2000
export BEAM_SIZE=10
```

### Frontend
Some settings can be overridden via environment variables:
```bash
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_MAX_FILE_SIZE=2000  # in MB
```

### Backend
Configuration is managed via `application.properties`:
```properties
whisperrr.service.connect-timeout=5000
spring.servlet.multipart.max-file-size=1000MB
```

## Migration Notes

- All hardcoded values have been replaced with references to config files
- No breaking changes to API contracts
- Default values remain the same as before
- Environment-specific overrides continue to work as before
