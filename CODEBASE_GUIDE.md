# Whisperrr Codebase Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Critical Files and Their Roles](#critical-files-and-their-roles)
3. [Data Flow: Complete Request Journey](#data-flow-complete-request-journey)
4. [Database Architecture](#database-architecture)
5. [Service Interactions](#service-interactions)
6. [Learning Pathway](#learning-pathway)
7. [Key Design Patterns](#key-design-patterns)

---

## Architecture Overview

Whisperrr is a **stateless, microservices-based** audio transcription platform with three main services:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Whisperrr Platform Architecture            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐ │
│  │  React Frontend │◄──►│ Spring Boot API │◄──►│   Python    │ │
│  │   (Port 3000)   │    │   (Port 8080)   │    │  Service    │ │
│  │                 │    │                 │    │ (Port 8000) │ │
│  │  • TypeScript   │    │  • Java 21      │    │  • FastAPI  │ │
│  │  • React 18     │    │  • Spring Boot  │    │  • Whisper  │ │
│  │  • Tailwind CSS │    │  • No Database  │    │  • CTranslate│ │
│  └─────────────────┘    └─────────────────┘    └─────────────┘ │
│           │                       │                      │     │
│           │                       │                      │     │
│           ▼                       ▼                      ▼     │
│  ┌─────────────────┐              │              ┌─────────────┐ │
│  │   Web Browser   │              │              │   Whisper   │ │
│  │    (Client)     │              │              │   Models    │ │
│  └─────────────────┘              │              └─────────────┘ │
│                                   │                              │
│                          ⚠️ NO DATABASE - STATELESS            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Stateless Design**: No database required - all processing is immediate
2. **Microservices**: Three independent services communicating via HTTP
3. **Direct Processing**: Files are processed synchronously and results returned immediately
4. **Proxy Pattern**: Spring Boot acts as a lightweight proxy/validation layer

---

## Critical Files and Their Roles

### Frontend (React TypeScript)

#### Entry Point & Routing
- **`frontend/src/index.tsx`** - Application entry point, React root
- **`frontend/src/App.tsx`** - Main app component, routing setup
- **`frontend/src/pages/HomePage.tsx`** - Main page with upload and results display

#### Core Business Logic
- **`frontend/src/hooks/useTranscription.ts`** - **CRITICAL**: Manages entire transcription workflow
  - State management for transcription process
  - Integration with React Query for API calls
  - Error handling and progress tracking
  
- **`frontend/src/services/transcription.ts`** - **CRITICAL**: API service layer
  - `TranscriptionService.transcribeAudio()` - Makes POST request to backend
  - Handles FormData creation and file upload
  
- **`frontend/src/services/api.ts`** - HTTP client configuration
  - Axios instance with base URL and interceptors
  - Environment-based configuration

#### UI Components
- **`frontend/src/components/upload/FileUpload.tsx`** - File upload component with drag-and-drop
- **`frontend/src/components/results/ResultsView.tsx`** - Displays transcription results
- **`frontend/src/components/common/ModelSelector.tsx`** - Model selection dropdown
- **`frontend/src/components/common/ProgressBar.tsx`** - Progress indicator

#### Type Definitions
- **`frontend/src/types/transcription.ts`** - TypeScript interfaces for transcription data
- **`frontend/src/types/api.ts`** - API response type definitions

#### Configuration
- **`frontend/src/utils/constants.ts`** - **CRITICAL**: Application configuration (SINGLE SOURCE OF TRUTH)
  - Max file size (default: 1GB)
  - Supported file formats and extensions
  - Error and success messages
  - Environment variables can override defaults, but defaults are defined here
  - **No `.env` file reading** - constants.ts is the single source of truth

### Backend (Spring Boot Java)

#### Application Entry Point
- **`backend/src/main/java/com/shangmin/whisperrr/WhisperrrApiApplication.java`** - **CRITICAL**: Spring Boot application entry point
  - No database configuration (stateless)
  - Auto-configuration for web services

#### API Layer
- **`backend/src/main/java/com/shangmin/whisperrr/controller/AudioController.java`** - **CRITICAL**: REST API endpoints
  - `POST /api/audio/transcribe` - Main transcription endpoint
  - `GET /api/audio/health` - Health check endpoint
  - Receives MultipartFile from frontend

#### Service Layer
- **`backend/src/main/java/com/shangmin/whisperrr/service/AudioService.java`** - Service interface
- **`backend/src/main/java/com/shangmin/whisperrr/service/impl/AudioServiceImpl.java`** - **CRITICAL**: Core business logic
  - `transcribeAudio()` - Validates file, forwards to Python service
  - `validateAudioFile()` - File size and format validation
  - Uses RestTemplate to communicate with Python service
  - Extracts and transforms response from Python service

#### Data Transfer Objects (DTOs)
- **`backend/src/main/java/com/shangmin/whisperrr/dto/TranscriptionResultResponse.java`** - **CRITICAL**: Response structure
  - Contains transcription text, language, confidence, duration, etc.
  - Maps from Python service response to frontend format

- **`backend/src/main/java/com/shangmin/whisperrr/dto/ErrorResponse.java`** - Error response structure
- **`backend/src/main/java/com/shangmin/whisperrr/dto/TranscriptionStatus.java`** - Status enum (COMPLETED, FAILED)

#### Exception Handling
- **`backend/src/main/java/com/shangmin/whisperrr/exception/GlobalExceptionHandler.java`** - **CRITICAL**: Centralized error handling
  - `@ControllerAdvice` - Catches all exceptions
  - Maps exceptions to HTTP status codes
  - Includes correlation ID for request tracking

- **`backend/src/main/java/com/shangmin/whisperrr/exception/FileValidationException.java`** - File validation errors
- **`backend/src/main/java/com/shangmin/whisperrr/exception/TranscriptionProcessingException.java`** - Processing errors

#### Configuration
- **`backend/src/main/resources/application.properties`** - **CRITICAL**: Application configuration
  - Server port: 8080
  - Python service URL: `http://localhost:8000`
  - CORS configuration
  - File upload limits (1GB)
  - **NO DATABASE CONFIGURATION** - explicitly stateless

- **`backend/src/main/java/com/shangmin/whisperrr/config/CorsConfig.java`** - CORS configuration
- **`backend/src/main/java/com/shangmin/whisperrr/config/CorrelationIdFilter.java`** - Request correlation ID filter

#### Utilities
- **`backend/src/main/java/com/shangmin/whisperrr/util/SecurityUtils.java`** - Filename sanitization

### Python Service (FastAPI)

#### Application Entry Point
- **`python-service/app/main.py`** - **CRITICAL**: FastAPI application setup
  - FastAPI app initialization
  - CORS middleware configuration
  - Correlation ID middleware
  - Global exception handlers
  - Lifespan events (model loading on startup)

#### Core Transcription Service
- **`python-service/app/whisper_service.py`** - **CRITICAL**: Core transcription logic
  - `WhisperService` - Singleton service managing Whisper models
  - `load_model()` - Loads Faster Whisper model on startup
  - `transcribe_audio()` - Main transcription method
  - Model caching and resource management
  - Thread pool for concurrent processing

#### API Endpoints
- **`python-service/app/main.py`** (endpoints section):
  - `POST /transcribe` - Main transcription endpoint
  - `GET /health` - Health check with model status

#### Data Models
- **`python-service/app/models.py`** - **CRITICAL**: Pydantic models
  - `TranscriptionResponse` - Response structure with text, segments, language
  - `TranscriptionSegment` - Individual segment with timing
  - `HealthResponse` - Health check response
  - `ErrorResponse` - Error response structure

#### Configuration
- **`python-service/app/config.py`** - **CRITICAL**: Application settings (SINGLE SOURCE OF TRUTH)
  - Model size configuration (default: "base")
  - File size limits (default: 1GB)
  - CORS origins
  - Supported formats
  - Environment variables can override defaults, but defaults are defined here
  - **No `.env` file reading** - config.py is the single source of truth

#### Utilities
- **`python-service/app/utils.py`** - **CRITICAL**: File processing utilities
  - `validate_audio_file()` - Comprehensive file validation
  - `preprocess_audio()` - Audio preprocessing and conversion
  - `convert_audio_file()` - FFmpeg-based audio conversion
  - `convert_video_to_audio()` - Video to audio extraction
  - `detect_audio_format()` - Format detection using file signatures

#### Exception Handling
- **`python-service/app/exceptions.py`** - Custom exception classes
  - `WhisperrrException` - Base exception
  - `InvalidAudioFormat`, `FileTooLarge`, `TranscriptionFailed`, etc.

### Infrastructure

#### Docker Configuration
- **`docker-compose.yml`** - **CRITICAL**: Multi-service orchestration
  - Defines three services: frontend, backend, python-service
  - Network configuration
  - Volume mounts for development
  - Resource limits

- **`backend/Dockerfile`** - Backend container build
- **`frontend/Dockerfile`** - Frontend container build
- **`python-service/Dockerfile`** - Python service container build

---

## Data Flow: Complete Request Journey

### Step-by-Step Transcription Flow

```
1. USER UPLOADS FILE
   └─> HomePage.tsx: handleFileSelect()
       └─> FileUpload.tsx: onFileSelect callback
           └─> File stored in component state

2. USER CLICKS "TRANSCRIBE"
   └─> HomePage.tsx: handleTranscribe()
       └─> useTranscription.ts: transcribeAudio(file, modelSize)
           └─> transcription.ts: TranscriptionService.transcribeAudio()
               └─> api.ts: apiClient.post('/audio/transcribe', formData)
                   └─> HTTP POST to http://localhost:8080/api/audio/transcribe

3. BACKEND RECEIVES REQUEST
   └─> AudioController.java: transcribeAudio()
       └─> AudioServiceImpl.java: transcribeAudio()
           ├─> validateAudioFile() - File size, format, content type validation
           └─> RestTemplate.postForEntity() to Python service
               └─> HTTP POST to http://python-service:8000/transcribe
                   └─> MultipartFile converted to ByteArrayResource

4. PYTHON SERVICE PROCESSES
   └─> main.py: transcribe_audio() endpoint
       ├─> File validation (size, format)
       ├─> Temporary file creation
       └─> whisper_service.py: transcribe_audio()
           ├─> validate_audio_file() - Comprehensive validation
           ├─> preprocess_audio() - Audio conversion/preprocessing
           │   ├─> utils.py: detect_audio_format()
           │   ├─> utils.py: convert_video_to_audio() (if video)
           │   └─> utils.py: convert_audio_file() (if needed)
           └─> _transcribe_sync() - Actual Whisper transcription
               └─> Faster Whisper model.transcribe()
                   └─> Returns segments with text and timing

5. RESPONSE FLOWS BACK
   └─> whisper_service.py: _create_transcription_response()
       └─> TranscriptionResponse model created
           └─> main.py: Returns JSON response
               └─> Backend: AudioServiceImpl extracts data
                   └─> TranscriptionResultResponse created
                       └─> Frontend: useTranscription receives response
                           └─> ResultsView.tsx displays results
```

### Data Transformation Points

1. **Frontend → Backend**: `File` → `MultipartFile` → `ByteArrayResource`
2. **Backend → Python**: `ByteArrayResource` → `UploadFile` → Temporary file
3. **Python Processing**: Temporary file → Preprocessed WAV → Whisper segments
4. **Python → Backend**: `TranscriptionResponse` (JSON) → `Map<String, Object>` → `TranscriptionResultResponse`
5. **Backend → Frontend**: `TranscriptionResultResponse` (JSON) → TypeScript interface

---

## Database Architecture

### ⚠️ **IMPORTANT: NO DATABASE EXISTS**

Whisperrr is **completely stateless** - there is **NO database** in this architecture.

### Why No Database?

1. **Instant Processing**: Files are processed immediately and results returned synchronously
2. **No Persistence Needed**: Results are returned directly to the user, not stored
3. **Simplified Deployment**: No database setup, migrations, or maintenance required
4. **Stateless Services**: All services can be horizontally scaled without shared state

### What This Means

- **No Entity Classes**: The `entity/` directory exists but is empty
- **No Repository Interfaces**: The `repository/` directory exists but is empty
- **No Database Configuration**: `application.properties` has no database settings
- **No Migrations**: No Flyway/Liquibase migrations exist
- **No JPA/Hibernate**: No ORM dependencies in `pom.xml`

### Data Storage (Temporary Only)

The only "storage" in the system is:

1. **Temporary Files** (Python Service):
   - Location: `/tmp/whisperrr_uploads/` (configurable via `upload_dir`)
   - Purpose: Hold uploaded files during processing
   - Lifecycle: Created → Processed → Deleted immediately after transcription
   - Cleanup: Automatic via `cleanup_temp_files` setting

2. **In-Memory State** (All Services):
   - Frontend: React component state (lost on page refresh)
   - Backend: No persistent state
   - Python Service: Model loaded in memory (persists for service lifetime)

### If You Need to Add a Database

If persistence is required in the future, you would need to:

1. Add database dependencies to `pom.xml` (e.g., Spring Data JPA, PostgreSQL driver)
2. Configure database in `application.properties`
3. Create entity classes in `entity/` package
4. Create repository interfaces in `repository/` package
5. Add migration scripts in `resources/db/migration/`
6. Update service layer to persist data

**Current State**: The codebase is intentionally designed without a database for simplicity and instant results.

---

## Service Interactions

### Communication Patterns

#### 1. Frontend ↔ Backend
- **Protocol**: HTTP REST API
- **Format**: JSON (requests/responses), MultipartFormData (file uploads)
- **Base URL**: `http://localhost:8080/api` (configurable via `REACT_APP_API_URL`)
- **CORS**: Enabled via `CorsConfig.java`

#### 2. Backend ↔ Python Service
- **Protocol**: HTTP REST API
- **Format**: MultipartFormData (file uploads), JSON (responses)
- **Base URL**: `http://python-service:8000` (Docker) or `http://localhost:8000` (local)
- **Client**: Spring `RestTemplate` in `AudioServiceImpl.java`
- **Timeout**: 5 seconds connection timeout, no read timeout (for long transcriptions)

#### 3. Python Service ↔ Whisper Models
- **Protocol**: Direct Python API calls
- **Library**: `faster-whisper` (CTranslate2 backend)
- **Model Loading**: On service startup (lifespan event)
- **Caching**: Model stays in memory for service lifetime

### Request/Response Examples

#### Frontend → Backend Request
```typescript
POST /api/audio/transcribe
Content-Type: multipart/form-data

FormData:
  - audioFile: File (binary)
  - modelSize: "base" (optional query param)
```

#### Backend → Python Service Request
```java
POST http://python-service:8000/transcribe?model_size=base
Content-Type: multipart/form-data

Body:
  - file: ByteArrayResource (audio file bytes)
```

#### Python Service Response
```json
{
  "text": "Hello, this is a transcription...",
  "language": "en",
  "duration": 45.2,
  "segments": [
    {
      "start_time": 0.0,
      "end_time": 5.5,
      "text": "Hello, this is a transcription..."
    }
  ],
  "confidence_score": 0.95,
  "model_used": "base",
  "processing_time": 2.3
}
```

#### Backend → Frontend Response
```json
{
  "transcriptionText": "Hello, this is a transcription...",
  "language": "en",
  "confidence": 0.95,
  "duration": 45.2,
  "modelUsed": "base",
  "processingTime": 2.3,
  "completedAt": "2024-01-15T10:30:00",
  "status": "COMPLETED"
}
```

---

## Learning Pathway

### For New Developers: Where to Start

#### Phase 1: Understand the Flow (Start Here)
1. **Read this document** - Understand the overall architecture
2. **Start with the frontend** - `frontend/src/pages/HomePage.tsx`
   - See how users interact with the system
   - Follow the file upload flow
3. **Trace a request** - Follow the data flow section above with code open
   - Start: `HomePage.tsx` → `useTranscription.ts` → `transcription.ts`
   - Continue: `AudioController.java` → `AudioServiceImpl.java`
   - Finish: `main.py` → `whisper_service.py` → `utils.py`

#### Phase 2: Understand Each Service

**Frontend (React TypeScript)**
1. `frontend/src/hooks/useTranscription.ts` - Core workflow logic
2. `frontend/src/services/transcription.ts` - API communication
3. `frontend/src/components/upload/FileUpload.tsx` - File upload UI
4. `frontend/src/components/results/ResultsView.tsx` - Results display

**Backend (Spring Boot)**
1. `AudioController.java` - API endpoints
2. `AudioServiceImpl.java` - Business logic and Python service integration
3. `GlobalExceptionHandler.java` - Error handling
4. `TranscriptionResultResponse.java` - Response structure

**Python Service (FastAPI)**
1. `main.py` - FastAPI app and endpoints
2. `whisper_service.py` - Core transcription service
3. `utils.py` - File processing utilities
4. `config.py` - Configuration management

#### Phase 3: Deep Dive into Specific Areas

**File Processing**
- `python-service/app/utils.py` - All file validation and conversion logic
- `backend/src/main/java/com/shangmin/whisperrr/service/impl/AudioServiceImpl.java` - Backend validation

**Error Handling**
- `backend/src/main/java/com/shangmin/whisperrr/exception/GlobalExceptionHandler.java`
- `python-service/app/exceptions.py`
- `python-service/app/main.py` (exception handlers)

**Configuration**
- `backend/src/main/resources/application.properties`
- `python-service/app/config.py`
- `docker-compose.yml`

### Critical Files to Understand First

**Must Read (In Order):**
1. `frontend/src/pages/HomePage.tsx` - User interface
2. `frontend/src/hooks/useTranscription.ts` - Frontend workflow
3. `backend/src/main/java/com/shangmin/whisperrr/controller/AudioController.java` - API entry point
4. `backend/src/main/java/com/shangmin/whisperrr/service/impl/AudioServiceImpl.java` - Backend logic
5. `python-service/app/main.py` - Python service entry point
6. `python-service/app/whisper_service.py` - Transcription engine

**Important Supporting Files:**
- `backend/src/main/java/com/shangmin/whisperrr/exception/GlobalExceptionHandler.java` - Error handling
- `python-service/app/utils.py` - File processing
- `python-service/app/config.py` - Configuration

---

## Key Design Patterns

### 1. Proxy Pattern (Backend)
The Spring Boot backend acts as a proxy between frontend and Python service:
- **Purpose**: Validation, error handling, CORS management
- **Implementation**: `AudioServiceImpl` forwards requests to Python service
- **Benefits**: Separation of concerns, centralized validation

### 2. Singleton Pattern (Python Service)
The `WhisperService` uses singleton pattern:
- **Purpose**: Single model instance shared across requests
- **Implementation**: `__new__` method with thread-safe locking
- **Benefits**: Efficient memory usage, model caching

### 3. Service Layer Pattern (All Services)
Business logic separated from controllers:
- **Frontend**: `TranscriptionService` separates API calls from components
- **Backend**: `AudioService` interface with implementation
- **Python**: `WhisperService` encapsulates model management

### 4. DTO Pattern (Backend)
Data Transfer Objects for API communication:
- **Purpose**: Decouple internal structure from API contract
- **Implementation**: `TranscriptionResultResponse`, `ErrorResponse`
- **Benefits**: Versioning, validation, type safety

### 5. Exception Handling Pattern
Centralized exception handling:
- **Backend**: `@ControllerAdvice` with `GlobalExceptionHandler`
- **Python**: Custom exception hierarchy with global handlers
- **Benefits**: Consistent error responses, correlation ID tracking

### 6. Configuration Pattern
Environment-based configuration:
- **Backend**: `application.properties` with `@Value` injection
- **Python**: Pydantic `BaseSettings` with environment variables
- **Frontend**: Configuration in `frontend/src/utils/constants.ts` (single source of truth)
  - Environment variables can override defaults, but defaults are defined in constants.ts
  - API URL can be overridden via `REACT_APP_API_URL` environment variable

### 7. Stateless Architecture
No shared state between requests:
- **No Database**: All processing is immediate
- **No Session Storage**: Each request is independent
- **Benefits**: Scalability, simplicity, no state management overhead

---

## File Dependency Graph

```
Frontend Flow:
HomePage.tsx
  ├─> useTranscription.ts
  │     └─> transcription.ts
  │           └─> api.ts (axios)
  ├─> FileUpload.tsx
  └─> ResultsView.tsx

Backend Flow:
AudioController.java
  └─> AudioService (interface)
        └─> AudioServiceImpl.java
              ├─> RestTemplate (HTTP client)
              └─> TranscriptionResultResponse.java

Python Service Flow:
main.py
  ├─> whisper_service.py
  │     ├─> config.py
  │     └─> utils.py
  ├─> models.py
  └─> exceptions.py
```

---

## Common Development Tasks

### Adding a New API Endpoint

1. **Backend**:
   - Add method to `AudioController.java`
   - Add method to `AudioService` interface
   - Implement in `AudioServiceImpl.java`
   - Create/update DTOs if needed

2. **Frontend**:
   - Add method to `transcription.ts` (or appropriate service)
   - Update TypeScript types in `types/` directory
   - Add UI component if needed

3. **Python Service** (if needed):
   - Add endpoint to `main.py`
   - Add business logic to `whisper_service.py` or new service
   - Update `models.py` if new data structures needed

### Debugging a Request

1. **Frontend**: Check browser DevTools Network tab
2. **Backend**: Check logs (correlation ID helps track requests)
3. **Python Service**: Check FastAPI logs, use `/health` endpoint
4. **Full Stack**: Follow correlation ID through all services

### Understanding Error Flow

1. **Python Service Error**:
   - Exception raised in `whisper_service.py` or `utils.py`
   - Caught by `main.py` exception handlers
   - Returns `ErrorResponse` JSON

2. **Backend Error**:
   - `RestTemplate` receives error response
   - `AudioServiceImpl` throws `TranscriptionProcessingException`
   - `GlobalExceptionHandler` catches and formats response

3. **Frontend Error**:
   - Axios interceptor receives error
   - `useTranscription` hook updates error state
   - UI displays error message

---

## Summary

### Key Takeaways

1. **No Database**: System is completely stateless - no persistence layer
2. **Three Services**: Frontend (React), Backend (Spring Boot), Python (FastAPI)
3. **Direct Processing**: Files processed immediately, results returned synchronously
4. **Proxy Pattern**: Backend acts as validation/proxy layer
5. **Singleton Model**: Python service loads Whisper model once, reuses for all requests

### Critical Path Through Codebase

**For Understanding Transcription Flow:**
```
HomePage.tsx → useTranscription.ts → transcription.ts → 
AudioController.java → AudioServiceImpl.java → 
main.py → whisper_service.py → utils.py → Whisper Model
```

**For Understanding Error Handling:**
```
Any Exception → GlobalExceptionHandler.java (backend) OR 
main.py exception handlers (Python) → ErrorResponse → Frontend error display
```

**For Understanding Configuration:**
```
application.properties (backend) → @Value injection →
config.py (Python) → Settings class →
docker-compose.yml → Environment variables
```

---

This guide provides a comprehensive understanding of how the Whisperrr codebase works. Use it as a reference when navigating the codebase, understanding data flow, or making changes to the system.


