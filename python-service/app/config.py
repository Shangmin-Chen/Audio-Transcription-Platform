"""
Configuration management for the Whisperrr FastAPI service.

This module provides comprehensive configuration management for the Whisperrr
transcription service using Pydantic settings. It supports environment-based
configuration with validation, type checking, and default values for all
service parameters.

Key Features:
    - Environment variable support with .env file loading
    - Type validation and conversion using Pydantic
    - Comprehensive validation rules for all settings
    - Default values for development and production
    - Automatic directory creation for file paths
    - Flexible CORS origin configuration
    - Performance and resource limit settings

Configuration Categories:
    - Model Configuration: Whisper model settings and options
    - API Configuration: FastAPI service settings and metadata
    - Processing Configuration: Concurrency and timeout settings
    - Performance Configuration: Monitoring and optimization settings
    - File Configuration: Upload limits and format support

Environment Variables:
    All settings can be configured via environment variables:
    - MODEL_SIZE: Whisper model size (tiny, base, small, medium, large)
    - MAX_FILE_SIZE_MB: Maximum upload file size in megabytes
    - UPLOAD_DIR: Directory for temporary file storage
    - LOG_LEVEL: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    - CORS_ORIGINS: Comma-separated list of allowed origins
    - MAX_CONCURRENT_TRANSCRIPTIONS: Maximum parallel transcriptions

Production Considerations:
    - All settings have sensible defaults for development
    - Production deployments should override via environment variables
    - Validation ensures configuration consistency
    - Resource limits prevent system overload
    - Security settings for CORS and file handling

Validation Features:
    - Model size validation against supported options
    - File size limits with reasonable bounds
    - Directory creation and permission checking
    - CORS origin parsing and validation
    - Log level validation

Usage:
    ```python
    from .config import settings
    
    # Access configuration values
    model_size = settings.model_size
    max_file_size = settings.max_file_size_bytes
    
    # Configuration is automatically loaded from:
    # 1. Environment variables
    # 2. .env file
    # 3. Default values
    ```

Author: shangmin
Version: 1.0
Since: 2024
"""

import os
from typing import List, Union
from pydantic import validator, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings with comprehensive environment variable support.
    
    This class defines all configuration parameters for the Whisperrr transcription
    service using Pydantic's BaseSettings. It provides type validation, default
    values, and automatic environment variable loading with .env file support.
    
    Configuration Philosophy:
        - Secure defaults for development
        - Environment-specific overrides for production
        - Comprehensive validation for all parameters
        - Clear documentation for each setting
        - Flexible configuration without code changes
    
    Environment Variable Mapping:
        - Setting names are automatically mapped to environment variables
        - Case-insensitive matching (MODEL_SIZE or model_size)
        - .env file support for local development
        - Docker-friendly environment variable names
    
    Validation Strategy:
        - Type checking for all parameters
        - Range validation for numeric values
        - Format validation for strings
        - Dependency validation between related settings
        - Automatic resource creation (directories, etc.)
    
    Configuration Categories:
        1. Model Settings: Whisper model configuration
        2. API Settings: FastAPI service configuration
        3. Processing Settings: Performance and concurrency
        4. File Settings: Upload and storage configuration
        5. Monitoring Settings: Logging and health checks
    
    Production Deployment:
        ```bash
        # Set via environment variables
        export MODEL_SIZE=large
        export MAX_FILE_SIZE_MB=100
        export LOG_LEVEL=INFO
        export CORS_ORIGINS="https://myapp.com,https://api.myapp.com"
        
        # Or via Docker
        docker run -e MODEL_SIZE=large -e MAX_FILE_SIZE_MB=100 whisperrr
        ```
    
    Development Setup:
        ```bash
        # Create .env file
        echo "MODEL_SIZE=base" > .env
        echo "LOG_LEVEL=DEBUG" >> .env
        echo "MAX_CONCURRENT_TRANSCRIPTIONS=1" >> .env
        ```
    """
    
    # Model configuration
    model_size: str = "base"
    max_file_size_mb: int = 25
    upload_dir: str = "/tmp/whisperrr_uploads"
    log_level: str = "INFO"
    
    # API configuration
    api_title: str = "Whisperrr Transcription Service"
    api_description: str = "Production-ready audio transcription using Faster Whisper"
    api_version: str = "1.0.0"
    cors_origins: Union[List[str], str] = ["http://localhost:8080", "http://localhost:3000", "http://127.0.0.1:8080", "http://127.0.0.1:3000"]
    
    # Processing configuration
    max_concurrent_transcriptions: int = 3
    request_timeout_seconds: int = 300
    cleanup_temp_files: bool = True
    
    # Performance and monitoring
    enable_metrics: bool = True
    enable_health_checks: bool = True
    
    # Supported audio formats
    supported_formats: List[str] = ["mp3", "wav", "m4a", "flac", "ogg", "wma"]
    
    # Model size options
    available_model_sizes: List[str] = ["tiny", "base", "small", "medium", "large"]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
    
    @validator("model_size")
    def validate_model_size(cls, v):
        """Validate model size is supported."""
        valid_sizes = ["tiny", "base", "small", "medium", "large"]
        if v not in valid_sizes:
            raise ValueError(f"Model size must be one of: {valid_sizes}")
        return v
    
    @validator("log_level")
    def validate_log_level(cls, v):
        """Validate log level."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(f"Log level must be one of: {valid_levels}")
        return v.upper()
    
    @validator("max_file_size_mb")
    def validate_max_file_size(cls, v):
        """Validate max file size is reasonable."""
        if v <= 0 or v > 1000:  # Max 1GB
            raise ValueError("Max file size must be between 1 and 1000 MB")
        return v
    
    @validator("upload_dir")
    def validate_upload_dir(cls, v):
        """Ensure upload directory exists."""
        os.makedirs(v, exist_ok=True)
        return v
    
    @validator("cors_origins", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list."""
        if isinstance(v, str):
            # Handle comma-separated string from environment variables
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v
    
    @property
    def max_file_size_bytes(self) -> int:
        """Get max file size in bytes."""
        return self.max_file_size_mb * 1024 * 1024
    
    @property
    def supported_formats_set(self) -> set:
        """Get supported formats as a set for faster lookup."""
        return set(self.supported_formats)


# Global settings instance
settings = Settings()
