"""
FastAPI application for the Whisperrr transcription service.

This module serves as the main entry point for the Whisperrr Python transcription service,
which provides high-quality speech-to-text capabilities using Faster Whisper (faster-whisper).
The service is designed as a production-ready microservice that can be deployed independently
and integrated with the Spring Boot backend API. Faster Whisper is up to 4x faster than OpenAI
Whisper with less memory usage, powered by CTranslate2.

Architecture Overview:
    The service follows a layered architecture pattern:
    - API Layer: FastAPI endpoints for HTTP communication
    - Service Layer: WhisperService for model management and transcription
    - Utility Layer: Helper functions for audio processing and validation
    - Configuration Layer: Environment-based configuration management

Key Features:
    - High-quality transcription using Faster Whisper models (up to 4x faster)
    - Asynchronous processing with ThreadPoolExecutor
    - Multiple audio format support (MP3, WAV, M4A, FLAC, OGG)
    - Dynamic model loading and caching
    - Comprehensive error handling and logging
    - Performance monitoring and metrics
    - CORS configuration for cross-origin requests
    - Health checks and service monitoring
    - Optimized inference with CTranslate2 (CPU and GPU support)

Processing Flow:
    1. Client uploads audio file via POST /transcribe
    2. Service validates file format, size, and content
    3. Audio is preprocessed and normalized if needed
    4. Whisper model transcribes the audio asynchronously
    5. Results are formatted and returned with metadata
    6. Temporary files are cleaned up automatically

Integration:
    This service is designed to work with the Spring Boot backend:
    - Backend forwards transcription requests to this service
    - Results are returned to backend for immediate response to client
    - CORS is configured to accept requests from backend

Performance Considerations:
    - ThreadPoolExecutor for concurrent processing
    - Model caching to avoid repeated loading
    - Memory management and cleanup
    - Configurable concurrency limits
    - Efficient audio preprocessing

Error Handling:
    - Custom exception hierarchy for different error types
    - Comprehensive error logging with correlation IDs
    - Graceful degradation for service failures
    - Proper HTTP status codes for different error scenarios

Monitoring and Observability:
    - Structured logging with performance metrics
    - Health check endpoints for monitoring
    - Memory usage tracking
    - Request correlation IDs for tracing
    - Processing time measurements

Author: shangmin
Version: 1.0
Since: 2024
"""

import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from .config import settings
from .models import (
    TranscriptionRequest,
    TranscriptionResponse,
    ModelInfoResponse,
    HealthResponse,
    ErrorResponse
)
from .whisper_service import whisper_service
from .exceptions import WhisperrrException
from .utils import (
    get_correlation_id,
    get_memory_usage,
    log_performance_metrics,
    safe_filename
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events.
    
    This context manager handles the complete lifecycle of the FastAPI application,
    including service initialization, model loading, and graceful shutdown. It ensures
    that resources are properly managed and cleaned up.
    
    Startup Process:
        1. Initialize logging and service components
        2. Load the default Whisper model into memory
        3. Verify model loading and system readiness
        4. Log startup completion and performance metrics
    
    Shutdown Process:
        1. Wait for active transcriptions to complete
        2. Shutdown thread pool executor gracefully
        3. Clear models from memory
        4. Clean up temporary files and resources
        5. Log shutdown completion
    
    Error Handling:
        - Startup failures are logged and re-raised to prevent service start
        - Shutdown errors are logged but don't prevent application termination
        - Resource cleanup is attempted even if errors occur
    
    Performance Monitoring:
        - Startup time is measured and logged
        - Memory usage is tracked during model loading
        - Service readiness is verified before accepting requests
    
    Args:
        app: The FastAPI application instance
        
    Yields:
        None: Control is yielded to the application during normal operation
        
    Raises:
        Exception: Re-raises any startup errors to prevent service initialization
    """
    # Startup
    logger.info("Starting Whisperrr transcription service")
    start_time = time.time()
    
    try:
        # Load default model
        logger.info(f"Loading default model: {settings.model_size}")
        await whisper_service.load_model(settings.model_size)
        
        startup_time = time.time() - start_time
        logger.info(f"Service started successfully in {startup_time:.2f}s")
        
        yield
        
    except Exception as e:
        logger.error(f"Failed to start service: {e}")
        raise
    
    finally:
        # Shutdown
        logger.info("Shutting down Whisperrr transcription service")
        await whisper_service.cleanup()
        logger.info("Service shutdown completed")


# Create FastAPI application
app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Middleware for request logging and correlation IDs
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Middleware for request logging and correlation ID tracking."""
    correlation_id = get_correlation_id()
    request.state.correlation_id = correlation_id
    
    start_time = time.time()
    
    # Log request
    logger.info(
        f"Request started: {request.method} {request.url.path} "
        f"[{correlation_id}]"
    )
    
    try:
        response = await call_next(request)
        
        # Log response
        duration = time.time() - start_time
        logger.info(
            f"Request completed: {request.method} {request.url.path} "
            f"[{correlation_id}] - {response.status_code} - {duration:.3f}s"
        )
        
        # Add correlation ID to response headers
        response.headers["X-Correlation-ID"] = correlation_id
        
        return response
    
    except Exception as e:
        duration = time.time() - start_time
        logger.error(
            f"Request failed: {request.method} {request.url.path} "
            f"[{correlation_id}] - {duration:.3f}s - {str(e)}"
        )
        raise


# Global exception handler
@app.exception_handler(WhisperrrException)
async def whisperrr_exception_handler(request: Request, exc: WhisperrrException):
    """Handle custom Whisperrr exceptions."""
    correlation_id = getattr(request.state, 'correlation_id', None)
    
    error_response = ErrorResponse(
        error_type=exc.error_code or "WHISPERRR_ERROR",
        message=exc.message,
        details=exc.details,
        correlation_id=correlation_id
    )
    
    # Map error codes to HTTP status codes
    status_code_map = {
        "INVALID_AUDIO_FORMAT": 400,
        "FILE_TOO_LARGE": 413,
        "MODEL_NOT_LOADED": 503,
        "TRANSCRIPTION_FAILED": 500,
        "MODEL_LOAD_FAILED": 500,
        "AUDIO_PROCESSING_ERROR": 400,
        "FILE_SYSTEM_ERROR": 500
    }
    
    status_code = status_code_map.get(exc.error_code, 500)
    
    return JSONResponse(
        status_code=status_code,
        content=error_response.dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    correlation_id = getattr(request.state, 'correlation_id', None)
    
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    error_response = ErrorResponse(
        error_type="INTERNAL_SERVER_ERROR",
        message="An internal server error occurred",
        details={"exception_type": type(exc).__name__},
        correlation_id=correlation_id
    )
    
    return JSONResponse(
        status_code=500,
        content=error_response.dict()
    )


# Dependency to get correlation ID
def get_correlation_id_dependency(request: Request) -> str:
    """Get correlation ID from request state."""
    return getattr(request.state, 'correlation_id', str(uuid.uuid4()))


# API Endpoints

@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    model_size: str = Query(None, description="Model size to use"),
    language: str = Query(None, description="Language hint (ISO 639-1)"),
    temperature: float = Query(0.0, ge=0.0, le=1.0, description="Temperature for sampling"),
    task: str = Query("transcribe", description="Task: transcribe or translate"),
    correlation_id: str = Depends(get_correlation_id_dependency)
):
    """
    Transcribe an audio file using Faster Whisper model.
    
    This endpoint provides high-quality speech-to-text transcription for uploaded
    audio files. It supports multiple audio formats and provides detailed results
    including timing information, confidence scores, and language detection.
    
    Supported Audio Formats:
        - MP3 (.mp3): Most common compressed format
        - WAV (.wav): Uncompressed, highest quality
        - M4A (.m4a): Apple's compressed format
        - FLAC (.flac): Lossless compression
        - OGG (.ogg): Open-source compressed format
        - WMA (.wma): Windows Media Audio
    
    Processing Pipeline:
        1. File validation (format, size, content type)
        2. Audio preprocessing and normalization
        3. Whisper model transcription with specified parameters
        4. Result formatting with timing and confidence data
        5. Temporary file cleanup
    
    Model Selection:
        - tiny: Fastest, least accurate (39 MB)
        - base: Good balance of speed and accuracy (74 MB) [default]
        - small: Better accuracy, slower (244 MB)
        - medium: Good accuracy, slower (769 MB)
        - large: Best accuracy, slowest (1550 MB)
        - large-v2: Latest large model variant (1550 MB)
        - large-v3: Latest large model variant (1550 MB)
    
    Language Detection:
        - Automatic language detection if not specified
        - 99+ languages supported by Whisper
        - Language hint can improve accuracy for known languages
    
    Temperature Parameter:
        - 0.0: Deterministic output (recommended for most use cases)
        - 0.1-0.3: Slight randomness for creative applications
        - 0.4-1.0: Higher randomness (may reduce accuracy)
    
    Task Types:
        - "transcribe": Convert speech to text in original language
        - "translate": Convert speech to English text (regardless of input language)
    
    Response Format:
        Returns comprehensive transcription results including:
        - Full transcribed text
        - Detected language
        - Audio duration
        - Word-level segments with timestamps
        - Confidence scores (when available)
        - Processing metadata
    
    Performance Considerations:
        - Processing time varies by file length and model size
        - Larger models provide better accuracy but slower processing
        - Files are processed asynchronously to avoid blocking
        - Memory usage scales with model size and file length
    
    Error Handling:
        - File validation errors return 400 Bad Request
        - File size limit exceeded returns 413 Payload Too Large
        - Processing failures return 500 Internal Server Error
        - All errors include detailed error messages and correlation IDs
    
    Args:
        file: Uploaded audio file (multipart/form-data)
              Must be valid audio format within size limits
        model_size: Whisper model to use (optional, defaults to configured model)
                   Must be one of: tiny, base, small, medium, large
        language: Language hint as ISO 639-1 code (optional, e.g., "en", "es", "fr")
                 Improves accuracy when input language is known
        temperature: Sampling temperature (optional, default 0.0)
                    Controls randomness in transcription output
        task: Processing task (optional, default "transcribe")
              Either "transcribe" or "translate"
        correlation_id: Request tracking ID (automatically generated)
    
    Returns:
        TranscriptionResponse: Comprehensive transcription results including:
            - text: Complete transcribed text
            - language: Detected language code
            - duration: Audio duration in seconds
            - segments: List of timed segments with text
            - confidence_score: Overall confidence (0.0-1.0)
            - model_used: Whisper model size used
            - processing_time: Time taken to process
    
    Raises:
        HTTPException 400: Invalid file format, size, or parameters
        HTTPException 413: File size exceeds maximum limit
        HTTPException 500: Transcription processing failed
        HTTPException 503: Service unavailable (model not loaded)
    
    Example:
        ```python
        import requests
        
        with open("audio.mp3", "rb") as f:
            response = requests.post(
                "http://localhost:8000/transcribe",
                files={"file": f},
                params={"language": "en", "model_size": "base"}
            )
        
        result = response.json()
        print(result["text"])
        ```
    """
    start_time = time.time()
    
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        # Create safe filename
        safe_name = safe_filename(file.filename)
        logger.info(f"Processing file: {safe_name} [{correlation_id}]")
        
        # Validate file size
        if file.size and file.size > settings.max_file_size_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size: {settings.max_file_size_mb}MB"
            )
        
        # Create temporary file
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{safe_name.split('.')[-1]}") as temp_file:
            # Write uploaded file to temporary location
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Transcribe audio
            result = await whisper_service.transcribe_audio(
                file_path=temp_file_path,
                model_size=model_size,
                language=language,
                temperature=temperature,
                task=task
            )
            
            # Log performance metrics
            duration = time.time() - start_time
            log_performance_metrics(
                operation="api_transcription",
                duration=duration,
                file_size=file.size,
                memory_usage=get_memory_usage(),
                correlation_id=correlation_id,
                model_size=model_size or whisper_service.get_current_model_size()
            )
            
            return result
        
        finally:
            # Cleanup temporary file
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logger.warning(f"Failed to cleanup temp file {temp_file_path}: {e}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription failed [{correlation_id}]: {e}")
        raise HTTPException(status_code=500, detail="Transcription failed")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint for service monitoring and load balancing.
    
    This endpoint provides essential health information about the transcription
    service, including model status, uptime, and overall service availability.
    It's designed for use by monitoring systems, load balancers, and clients
    to verify service readiness.
    
    Health Status Indicators:
        - "healthy": Service is fully operational with model loaded
        - "degraded": Service is running but model not loaded
        - "unhealthy": Service is experiencing issues (handled by exception handlers)
    
    Monitoring Information:
        - Model loading status and current model size
        - Service uptime since last restart
        - Memory usage and resource availability
        - Active transcription count
    
    Usage Scenarios:
        - Load balancer health checks for traffic routing
        - Monitoring system alerts and dashboards
        - Client-side service availability verification
        - Deployment readiness checks
        - Auto-scaling trigger conditions
    
    Response Interpretation:
        - HTTP 200 + "healthy": Service ready for transcription requests
        - HTTP 200 + "degraded": Service running but may need model loading
        - HTTP 500+: Service experiencing issues, check logs
    
    Returns:
        HealthResponse: Service health information including:
            - status: Overall health status ("healthy" or "degraded")
            - model_loaded: Whether Whisper model is loaded and ready
            - model_size: Current model size if loaded (e.g., "base", "large")
            - uptime: Service uptime in seconds since startup
    
    Example Response:
        ```json
        {
            "status": "healthy",
            "model_loaded": true,
            "model_size": "base",
            "uptime": 3600.5
        }
        ```
    """
    return HealthResponse(
        status="healthy" if whisper_service.is_model_loaded() else "degraded",
        model_loaded=whisper_service.is_model_loaded(),
        model_size=whisper_service.get_current_model_size(),
        uptime=round(whisper_service.get_uptime(), 2)
    )


@app.get("/model/info", response_model=ModelInfoResponse)
async def get_model_info():
    """
    Get detailed information about the currently loaded Faster Whisper model.
    
    This endpoint provides comprehensive information about the active Whisper model,
    including performance metrics, capabilities, and resource usage. It's useful
    for monitoring, debugging, and client applications that need to understand
    the current service configuration.
    
    Model Information Provided:
        - Current model size and capabilities
        - Memory usage and resource consumption
        - Model loading time and performance metrics
        - Supported languages (99+ languages)
        - Loading status and timestamps
    
    Use Cases:
        - Performance monitoring and optimization
        - Client applications adapting to model capabilities
        - Debugging transcription quality issues
        - Resource usage tracking and planning
        - Service configuration verification
    
    Model Characteristics:
        - tiny: 39 MB, fastest, basic accuracy
        - base: 74 MB, balanced speed/accuracy
        - small: 244 MB, better accuracy
        - medium: 769 MB, good accuracy
        - large: 1550 MB, best accuracy
    
    Returns:
        ModelInfoResponse: Detailed model information including:
            - model_size: Current model size (e.g., "base", "large")
            - memory_usage_mb: Current memory usage in megabytes
            - load_time_seconds: Time taken to load the model
            - supported_languages: List of supported language codes
            - is_loaded: Whether model is currently loaded and ready
            - last_loaded: Timestamp when model was last loaded
    
    Example Response:
        ```json
        {
            "model_size": "base",
            "memory_usage_mb": 1024.5,
            "load_time_seconds": 2.3,
            "supported_languages": ["en", "es", "fr", "de", ...],
            "is_loaded": true,
            "last_loaded": "2024-01-15T10:30:45.123Z"
        }
        ```
    """
    return whisper_service.get_model_info()


@app.post("/model/load/{model_size}")
async def load_model(model_size: str):
    """
    Load a specific Faster Whisper model size into memory.
    
    This endpoint allows dynamic loading of different Whisper model sizes based
    on accuracy and performance requirements. Loading a new model will replace
    the currently loaded model, so this operation should be used carefully in
    production environments with active transcriptions.
    
    Model Size Options:
        - tiny: 39 MB, ~32x realtime, lowest accuracy
        - base: 74 MB, ~16x realtime, good balance
        - small: 244 MB, ~6x realtime, better accuracy
        - medium: 769 MB, ~2x realtime, high accuracy
        - large: 1550 MB, ~1x realtime, highest accuracy
    
    Performance Considerations:
        - Larger models require more memory and processing time
        - Model loading can take several seconds to minutes
        - Loading blocks other model operations temporarily
        - Previous model is unloaded to free memory
    
    Use Cases:
        - Switching to higher accuracy model for important transcriptions
        - Downgrading to faster model for real-time applications
        - Testing different models for quality comparison
        - Optimizing resource usage based on requirements
    
    Concurrency Handling:
        - Only one model loading operation allowed at a time
        - Active transcriptions are allowed to complete
        - New transcription requests wait for model loading
        - Proper error handling for concurrent load attempts
    
    Args:
        model_size: Whisper model size to load
                   Must be one of: tiny, base, small, medium, large
    
    Returns:
        dict: Model loading result including:
            - success: Whether loading succeeded
            - model_size: The loaded model size
            - load_time_seconds: Time taken to load
            - memory_usage_mb: Memory usage after loading
            - message: Success/failure message
    
    Raises:
        HTTPException 400: Invalid model size specified
        HTTPException 409: Model loading already in progress
        HTTPException 500: Model loading failed due to system error
    
    Example:
        ```python
        response = requests.post("http://localhost:8000/model/load/large")
        result = response.json()
        print(f"Loaded {result['model_size']} in {result['load_time_seconds']}s")
        ```
    """
    try:
        # Validate model size
        if model_size not in settings.available_model_sizes:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid model size. Available: {settings.available_model_sizes}"
            )
        
        # Load the model
        result = await whisper_service.load_model(model_size)
        return {
            "success": True,
            "model_size": model_size,
            "message": f"Model {model_size} loaded successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to load model {model_size}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")






if __name__ == "__main__":
    # Run the application
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=settings.log_level.lower()
    )
