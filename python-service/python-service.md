# Python Service Documentation

## Overview

The Python service is a **FastAPI-based microservice** that provides high-quality audio transcription using **Faster Whisper** (faster-whisper). It's designed as a production-ready service that can handle multiple concurrent transcription requests efficiently.

### Key Features

- **Fast Transcription**: Uses Faster Whisper, which is up to 4x faster than OpenAI Whisper with less memory usage
- **Model Management**: Singleton pattern ensures models are loaded once and reused across requests
- **Concurrent Processing**: Thread pool executor handles multiple transcriptions simultaneously
- **Production Ready**: Comprehensive error handling, logging, health checks, and resource management

---

## Architecture Flow

```
┌─────────────────┐
│  HTTP Request   │
│  (Audio File)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   main.py       │  ← FastAPI app, endpoints, middleware
│   (API Layer)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ whisper_service │  ← Model management, transcription orchestration
│     .py         │
└────────┬────────┘
         │
         ├──► config.py      (Configuration)
         ├──► models.py      (Data models)
         ├──► exceptions.py (Error handling)
         └──► utils.py       (Helper functions)
```

### Request Flow

1. **Client uploads audio file** → `POST /transcribe`
2. **main.py** receives request, validates file
3. **whisper_service.py** loads model (if not loaded) and transcribes
4. **utils.py** handles audio preprocessing and validation
5. **exceptions.py** handles any errors that occur
6. **Response** returned with transcription results

---

## File Structure & Responsibilities

### Core Application Files

#### `app/main.py` - **API Entry Point & HTTP Layer**

**Purpose**: FastAPI application that handles HTTP requests and responses.

**Key Responsibilities**:
- Creates FastAPI app instance with CORS middleware
- Defines API endpoints (`/transcribe`, `/health`, `/model/info`, `/model/load/{model_size}`)
- Request/response handling and validation
- Middleware for logging and correlation IDs
- Global exception handlers
- Application lifespan management (startup/shutdown)

**Key Components**:
- `lifespan()`: Manages app lifecycle - loads model on startup, cleans up on shutdown
- `@app.post("/transcribe")`: Main transcription endpoint
- `@app.get("/health")`: Health check endpoint
- Exception handlers: Convert custom exceptions to HTTP responses

**How it works**:
```python
# On startup: Loads default model
await whisper_service.load_model(settings.model_size)

# On request: Validates file, calls whisper_service, returns response
result = await whisper_service.transcribe_audio(file_path, ...)

# On shutdown: Cleans up resources
await whisper_service.cleanup()
```

---

#### `app/whisper_service.py` - **Core Transcription Engine**

**Purpose**: Singleton service that manages Faster Whisper models and performs transcriptions.

**Key Responsibilities**:
- Model lifecycle management (loading, caching, cleanup)
- Transcription orchestration
- Thread-safe concurrent processing
- Device detection (CPU/GPU) and compute type selection
- Performance monitoring

**Key Components**:
- `WhisperService` class: Singleton pattern ensures one instance
- `load_model()`: Loads Faster Whisper model into memory
- `transcribe_audio()`: Main transcription method
- `_detect_device()`: Detects CUDA availability for GPU acceleration
- `_get_compute_type()`: Selects optimal compute type (float16 for GPU, int8 for CPU)

**How it works**:
```python
# Singleton ensures model is loaded once
service = WhisperService()  # Always returns same instance

# Model loading (happens once, reused for all requests)
model = WhisperModel("base", device="cuda", compute_type="float16")

# Transcription (runs in thread pool for concurrency)
segments, info = model.transcribe(audio_file, beam_size=5)
```

**Why Singleton?**
- Models are large (39MB-1550MB) and take 5-30+ seconds to load
- Loading once and reusing saves time and memory
- Thread-safe design allows concurrent transcriptions

---

#### `app/config.py` - **Configuration Management**

**Purpose**: Centralized configuration using Pydantic settings with environment variable support.

**Key Responsibilities**:
- Loads configuration from environment variables or `.env` file
- Validates configuration values
- Provides default values for development
- Type-safe configuration access

**Key Settings**:
- `model_size`: Whisper model to use (tiny, base, small, medium, large, large-v2, large-v3)
- `max_file_size_mb`: Maximum upload size (default: 25MB)
- `max_concurrent_transcriptions`: Thread pool size (default: 3)
- `cors_origins`: Allowed CORS origins
- `log_level`: Logging verbosity

**How it works**:
```python
# Automatically loads from .env or environment variables
settings = Settings()

# Access configuration
model = settings.model_size  # "base"
max_size = settings.max_file_size_bytes  # 26214400
```

---

#### `app/models.py` - **Data Models (Pydantic)**

**Purpose**: Defines request/response data structures with validation.

**Key Models**:
- `TranscriptionRequest`: Input parameters (model_size, language, temperature)
- `TranscriptionResponse`: Output with text, segments, confidence, metadata
- `TranscriptionSegment`: Individual timed segment with start/end times
- `ModelInfoResponse`: Model status and information
- `HealthResponse`: Service health status
- `ErrorResponse`: Standardized error format

**How it works**:
```python
# Request validation happens automatically
@app.post("/transcribe")
async def transcribe(file: UploadFile, language: str = None):
    # FastAPI validates file and parameters
    
# Response is automatically serialized
return TranscriptionResponse(
    text="...",
    segments=[...],
    language="en"
)
```

---

#### `app/exceptions.py` - **Error Handling**

**Purpose**: Custom exception hierarchy for different error types.

**Exception Types**:
- `WhisperrrException`: Base exception class
- `InvalidAudioFormat`: Unsupported or corrupted audio
- `FileTooLarge`: File exceeds size limits
- `ModelNotLoaded`: Model not loaded when transcription requested
- `TranscriptionFailed`: Transcription process failed
- `ModelLoadFailed`: Model loading failed
- `AudioProcessingError`: Audio preprocessing failed
- `FileSystemError`: File operations failed

**How it works**:
```python
# Custom exceptions are caught by global handler in main.py
try:
    validate_audio_file(file_path)
except InvalidAudioFormat as e:
    # Automatically converted to HTTP 400 with error details
    raise HTTPException(status_code=400, detail=e.message)
```

**Benefits**:
- Consistent error format across the service
- Detailed error information for debugging
- Proper HTTP status codes
- Correlation IDs for request tracking

---

#### `app/utils.py` - **Helper Functions**

**Purpose**: Utility functions for file handling, audio processing, and common operations.

**Key Functions**:
- `validate_audio_file()`: Comprehensive audio file validation
- `preprocess_audio()`: Audio normalization and resampling (16kHz for Whisper)
- `get_audio_info()`: Extract audio metadata (duration, sample rate)
- `detect_audio_format()`: Detect format from file signature
- `create_temp_file()` / `cleanup_temp_file()`: Temporary file management
- `get_memory_usage()`: Memory monitoring
- `log_performance_metrics()`: Performance logging
- `get_correlation_id()`: Request tracking

**How it works**:
```python
# File validation
file_info = validate_audio_file("audio.mp3")
# Returns: {valid: True, format: "mp3", duration: 120.5, ...}

# Audio preprocessing
processed_file = preprocess_audio("audio.mp3")
# Resamples to 16kHz, normalizes, saves as WAV
# Returns: "/tmp/whisperrr_uploads/processed_audio.wav"
```

**Why preprocessing?**
- Whisper expects 16kHz sample rate
- Normalization improves transcription quality
- Consistent format reduces errors

---

#### `app/__init__.py` - **Package Initialization**

**Purpose**: Package metadata and initialization.

**Contents**:
- Module docstring
- Version and author information

---

### Configuration Files

#### `requirements.txt` - **Python Dependencies**

**Key Dependencies**:
- `fastapi`: Web framework
- `uvicorn[standard]`: ASGI server
- `faster-whisper`: Transcription engine (replaces openai-whisper)
- `pydantic` / `pydantic_settings`: Data validation and settings
- `librosa` / `soundfile`: Audio processing
- `python-multipart`: File upload handling

---

#### `env.example` - **Environment Variables Template**

**Purpose**: Example configuration file showing all available settings.

**Usage**:
```bash
# Copy to .env and customize
cp env.example .env
```

---

#### `Dockerfile` - **Container Configuration**

**Purpose**: Docker image definition for containerized deployment.

**Key Steps**:
1. Uses Python 3.12 slim base image
2. Installs system dependencies (curl for health checks)
3. Installs Python packages from requirements.txt
4. Copies application code
5. Creates upload directory
6. Exposes port 8000
7. Sets health check endpoint
8. Runs application

---

## How Files Work Together

### Example: Transcription Request Flow

```
1. Client Request
   └─► main.py: @app.post("/transcribe")
       ├─► Validates file size
       ├─► Creates temp file
       └─► Calls whisper_service.transcribe_audio()

2. Whisper Service
   └─► whisper_service.py: transcribe_audio()
       ├─► Checks if model loaded (loads if needed)
       ├─► Calls utils.py: validate_audio_file()
       ├─► Calls utils.py: preprocess_audio()
       └─► Runs transcription in thread pool
           └─► Uses Faster Whisper model
               └─► Returns segments and info

3. Response Creation
   └─► whisper_service.py: _create_transcription_response()
       ├─► Converts segments to TranscriptionSegment models
       ├─► Calculates confidence scores
       └─► Returns TranscriptionResponse

4. Error Handling
   └─► Any exceptions caught
       ├─► Custom exceptions (exceptions.py) → HTTP error responses
       └─► Logged with correlation ID

5. Cleanup
   └─► Temp files deleted
   └─► Resources released
```

### Configuration Flow

```
1. Application Start
   └─► config.py: Settings() loads from .env
       ├─► Validates all settings
       └─► Provides defaults if missing

2. Service Initialization
   └─► main.py: lifespan() startup
       └─► whisper_service.load_model(settings.model_size)
           └─► Uses config.py settings for model selection
```

### Error Flow

```
1. Error Occurs
   └─► Exception raised (e.g., InvalidAudioFormat)

2. Exception Handling
   └─► main.py: @app.exception_handler(WhisperrrException)
       ├─► Extracts error details from exception
       ├─► Maps error code to HTTP status
       └─► Returns ErrorResponse with correlation ID

3. Logging
   └─► All errors logged with context
       ├─► Correlation ID for request tracking
       └─► Error details for debugging
```

---

## Key Design Patterns

### 1. Singleton Pattern (whisper_service.py)
- **Why**: Models are expensive to load, so we load once and reuse
- **How**: `__new__()` method ensures only one instance exists

### 2. Dependency Injection (main.py)
- **Why**: Makes code testable and maintainable
- **How**: FastAPI's `Depends()` for request dependencies

### 3. Factory Pattern (config.py)
- **Why**: Centralized configuration creation
- **How**: `Settings()` class creates validated configuration

### 4. Strategy Pattern (whisper_service.py)
- **Why**: Different compute types for different devices
- **How**: `_get_compute_type()` selects strategy based on device

### 5. Thread Pool Pattern (whisper_service.py)
- **Why**: Handle concurrent transcriptions efficiently
- **How**: `ThreadPoolExecutor` manages concurrent operations

---

## Performance Optimizations

1. **Model Caching**: Model loaded once, reused for all requests
2. **Thread Pool**: Concurrent transcriptions without blocking
3. **Audio Preprocessing**: Optimized format for Whisper (16kHz WAV)
4. **Memory Management**: Automatic cleanup of temp files and resources
5. **Device Detection**: Automatic GPU acceleration when available
6. **Compute Types**: INT8 for CPU (faster), FP16 for GPU (accurate)

---

## Security Considerations

1. **File Validation**: Format and size checks before processing
2. **Temp File Cleanup**: Automatic deletion after processing
3. **CORS Configuration**: Restricted origins
4. **Size Limits**: Maximum file size enforcement
5. **Error Sanitization**: No sensitive data in error messages

---

## Monitoring & Observability

1. **Health Checks**: `/health` endpoint for monitoring
2. **Correlation IDs**: Request tracking across logs
3. **Performance Metrics**: Logged for each transcription
4. **Memory Usage**: Tracked and logged
5. **Structured Logging**: Easy to parse and analyze

---

## Summary

The Python service is a **well-architected microservice** that:

- **Separates concerns**: Each file has a clear, single responsibility
- **Handles concurrency**: Thread pools and singleton pattern
- **Manages resources**: Automatic cleanup and memory management
- **Provides observability**: Logging, metrics, health checks
- **Handles errors gracefully**: Comprehensive exception handling
- **Is production-ready**: Security, validation, monitoring

The architecture balances **simplicity** (easy to understand) with **robustness** (production-ready features), making it suitable for both development and production deployments.

