package com.shangmin.whisperrr.config;

import java.util.Set;

/**
 * Centralized application configuration constants.
 * 
 * <p>This class provides a single source of truth for all hardcoded configuration
 * values used throughout the application. Values can be overridden via application.properties
 * or environment variables.</p>
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */
public final class AppConfig {
    
    /** Maximum file size: 1GB in bytes. */
    public static final long MAX_FILE_SIZE_BYTES = 1000L * 1024 * 1024;
    
    /** Maximum file size in MB. */
    public static final int MAX_FILE_SIZE_MB = 1000;
    
    /** Default connection timeout for Python service: 5 seconds. */
    public static final int PYTHON_SERVICE_CONNECT_TIMEOUT_MS = 5000;
    
    /** Supported file extensions for audio and video files. */
    public static final Set<String> SUPPORTED_EXTENSIONS = Set.of(
        "mp3", "wav", "m4a", "flac", "ogg", "wma", "aac",
        "mp4", "avi", "mov", "mkv", "flv", "webm", "wmv", "m4v", "3gp"
    );
    
    /** Supported audio-only extensions. */
    public static final Set<String> AUDIO_EXTENSIONS = Set.of(
        "mp3", "wav", "m4a", "flac", "ogg", "wma", "aac"
    );
    
    /** Supported video extensions (will be converted to audio). */
    public static final Set<String> VIDEO_EXTENSIONS = Set.of(
        "mp4", "avi", "mov", "mkv", "flv", "webm", "wmv", "m4v", "3gp"
    );
    
    /** File size threshold for multipart uploads: 2KB. */
    public static final String MULTIPART_FILE_SIZE_THRESHOLD = "2KB";
    
    private AppConfig() {
        // Utility class - prevent instantiation
    }
}
