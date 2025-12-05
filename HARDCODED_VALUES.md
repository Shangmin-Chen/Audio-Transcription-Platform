# Hardcoded Values Documentation

This document tracks all hardcoded values found throughout the codebase, including their variable names and locations.

**Note:** All hardcoded values have been centralized into configuration files:
- **Backend (Java):** `backend/src/main/java/com/shangmin/whisperrr/config/AppConfig.java`
- **Python Service:** `python-service/app/config.py`
- **Frontend (TypeScript):** `frontend/src/utils/constants.ts`

All code now references these centralized configuration values instead of using hardcoded values directly.

## Backend (Java)

### AudioServiceImpl.java
- `MAX_FILE_SIZE = 1000 * 1024 * 1024` (Line 50) - Maximum file size: 1GB
- `connectTimeout = 5000` (Line 43) - Connection timeout: 5 seconds
- `SUPPORTED_EXTENSIONS` (Lines 46-49) - Hardcoded list of supported file extensions

### AudioController.java
- No hardcoded values found (uses service layer)

### application.properties
- `server.port=8080` (Line 3) - Server port
- `spring.servlet.multipart.max-file-size=1000MB` (Line 14) - Max file size
- `spring.servlet.multipart.max-request-size=1000MB` (Line 15) - Max request size
- `spring.servlet.multipart.file-size-threshold=2KB` (Line 16) - File size threshold
- `whisperrr.service.connect-timeout=5000` (Line 38) - Python service connection timeout

## Python Service

### config.py
- `model_size: str = "base"` (Line 13) - Default model size
- `max_file_size_mb: int = 1000` (Line 14) - Max file size: 1GB
- `upload_dir: str = "/tmp/whisperrr_uploads"` (Line 15) - Upload directory
- `log_level: str = "INFO"` (Line 16) - Log level
- `api_title: str = "Whisperrr Transcription Service"` (Line 19) - API title
- `api_description: str = "Production-ready audio transcription using Faster Whisper"` (Line 20) - API description
- `api_version: str = "1.0.0"` (Line 21) - API version
- `cors_origins` (Line 22) - CORS allowed origins list
- `max_concurrent_transcriptions: int = 3` (Line 25) - Max concurrent transcriptions
- `request_timeout_seconds: int = 300` (Line 26) - Request timeout: 5 minutes
- `cleanup_temp_files: bool = True` (Line 27) - Cleanup temp files flag
- `supported_formats` (Lines 34-39) - Supported file formats list
- `formats_requiring_conversion` (Lines 42-44) - Formats requiring conversion
- `available_model_sizes` (Line 47) - Available model sizes list

### whisper_service.py
- `beam_size = 5` (Line 273) - Beam size for transcription
- `target_sr = 16000` (Line 427 in utils.py) - Target sample rate: 16kHz
- Model descriptions dictionary (Lines 67-75) - Model size descriptions
- Supported languages list (Lines 78-89) - List of 99 supported languages

### utils.py
- `target_sr: int = 16000` (Line 427) - Target sample rate: 16kHz
- `"-ar", "16000"` (Line 284) - FFmpeg sample rate: 16kHz
- `"-ac", "1"` (Line 285) - FFmpeg audio channels: mono
- `timeout=10` (Line 68) - FFprobe timeout: 10 seconds
- `timeout=300` (Line 299) - FFmpeg conversion timeout: 5 minutes
- `timeout=300` (Line 380) - Video conversion timeout: 5 minutes

### main.py
- `host="0.0.0.0"` (Line 357) - Server host
- `port=8000` (Line 358) - Server port
- `reload=True` (Line 359) - Auto-reload flag
- `log_level="info"` (Line 360) - Log level

## Frontend (TypeScript/React)

### constants.ts
- `maxFileSize: 1000 * 1024 * 1024` (Line 12) - Maximum file size: 1GB
- `name: 'Whisperrr'` (Line 16) - Application name
- `version: '1.0.0'` (Line 17) - Application version
- `supportedFormats` (Lines 20-45) - Supported MIME types list
- `supportedExtensions` (Lines 47-50) - Supported file extensions list

### useTranscription.ts
- `POLL_INTERVAL_MS = 1000` (Line 26) - Poll interval: 1 second
- `MAX_POLL_ATTEMPTS = 300` (Line 27) - Max poll attempts: 300 (5 minutes)

### api.ts
- `baseURL: 'http://localhost:8080/api'` (Line 55) - Default API base URL
- `timeout: 0` (Line 57) - Request timeout: 0 (no timeout)

### fileValidation.ts
- `k = 1024` (Line 64) - Bytes conversion factor
- `sizes = ['Bytes', 'KB', 'MB', 'GB']` (Line 65) - File size units

### useFileUpload.ts
- `maxFiles = 1` (Line 41) - Default max files: 1

### ResultsView.tsx
- `setTimeout(() => setCopied(false), 2000)` (Line 49) - Copy feedback timeout: 2 seconds

### whisper_service.py
- `task="translate"` (Line 195 in main.py, Line 280 in whisper_service.py) - Transcription task type (always translate)
- `mapped_progress = 40.0 + (p * 0.6)` (Line 221) - Progress mapping: preprocessing 0-40%, transcription 40-100%
- `segment_progress = min(90.0, 10.0 + (idx * 1.5))` (Line 306) - Segment progress calculation

### utils.py
- `max_age_seconds: int = 3600` (Line 107 in job_manager.py) - Job cleanup max age: 1 hour

## Notes

- Many hardcoded values are configuration defaults that can be overridden via environment variables
- Some values (like sample rates, timeouts) are technical constants that should remain hardcoded
- File size limits and supported formats are duplicated across services - consider centralizing
- Port numbers and URLs are environment-specific and should be configurable
