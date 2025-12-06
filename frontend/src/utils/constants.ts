// Single source of truth for configuration
// Environment variables can override defaults, but defaults are defined here
const getMaxFileSize = (): number => {
  // Allow override via env var, but default to 50MB
  const envSize = process.env.REACT_APP_MAX_FILE_SIZE;
  if (envSize) {
    const sizeMB = parseInt(envSize, 10);
    if (!isNaN(sizeMB) && sizeMB > 0) {
      return sizeMB * 1024 * 1024;
    }
  }
  return 50 * 1024 * 1024; // Default: 50MB - demo site limit
};

export const APP_CONFIG = {
  name: 'Whisperrr',
  version: '1.0.0',
  description: 'AI-powered audio transcription platform',
  maxFileSize: getMaxFileSize(),
  supportedFormats: [
    'audio/mpeg',
    'audio/mp3',
    'audio/mpeg3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/flac',
    'audio/x-flac',
    'audio/ogg',
    'audio/vorbis',
    'audio/x-ms-wma',
    'audio/wma',
    'audio/aac',
    'audio/x-aac',
    'video/mp4',
    'video/x-msvideo',
    'video/quicktime',
    'video/x-matroska',
    'video/x-flv',
    'video/webm',
    'video/x-ms-wmv',
    'video/3gpp'
  ],
  supportedExtensions: [
    '.mp3', '.wav', '.m4a', '.flac', '.ogg', '.wma', '.aac',
    '.mp4', '.avi', '.mov', '.mkv', '.flv', '.webm', '.wmv', '.m4v', '.3gp'
  ],
};

export const ROUTES = {
  HOME: '/',
} as const;

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size must be less than 50MB',
  INVALID_FORMAT: 'Unsupported format. Please use audio formats (MP3, WAV, M4A, FLAC, OGG, WMA, AAC) or video formats (MP4, AVI, MOV, MKV, FLV, WEBM, WMV, M4V, 3GP)',
  UPLOAD_FAILED: 'Failed to upload file. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  TRANSCRIPTION_FAILED: 'Transcription failed. Please try with a different file.',
  FILE_REQUIRED: 'Please select an audio file to upload',
} as const;

export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: 'File uploaded successfully!',
  TRANSCRIPTION_COMPLETE: 'Transcription completed successfully!',
} as const;

/**
 * Transcription workflow configuration constants.
 * Optimized for Docker networking with single-worker Python service.
 */
export const TRANSCRIPTION_CONFIG = {
  /** Initial poll interval for job progress checks in milliseconds. */
  INITIAL_POLL_INTERVAL_MS: 1500, // Start with 1.5 seconds (faster initial polling)
  
  /** Maximum poll interval (adaptive polling will increase up to this). */
  MAX_POLL_INTERVAL_MS: 5000, // Max 5 seconds between polls (reduced for better responsiveness)
  
  /** How much to increase polling interval each time (adaptive backoff). */
  POLL_INTERVAL_BACKOFF_MS: 500, // Increase by 500ms each time (gentler backoff)
  
  /** Maximum time to wait for a job to complete (in milliseconds). */
  MAX_JOB_DURATION_MS: 2 * 60 * 60 * 1000, // 2 hours (supports very long audio files)
  
  /** Maximum time without progress update before considering job hung (in milliseconds). */
  MAX_STALL_TIME_MS: 10 * 60 * 1000, // 10 minutes without update = hung
} as const;

/**
 * API configuration constants.
 * Uses environment variable if provided, otherwise defaults to localhost.
 */
const getApiUrl = (): string => {
  // Use environment variable if provided
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Default to localhost
  return 'http://localhost:7331/api';
};

const resolvedApiUrl = getApiUrl();

// Debug logging to show which API URL is being used
console.log('[API Config] ============================================');
console.log('[API Config] Environment Variable Debug Info:');
console.log('[API Config]   REACT_APP_API_URL:', process.env.REACT_APP_API_URL || '(not set)');
console.log('[API Config]   NODE_ENV:', process.env.NODE_ENV || '(not set)');
if (process.env.REACT_APP_API_URL) {
  console.log('[API Config]   ✓ Using API URL from environment variable');
} else {
  console.log('[API Config]   ✓ Using default localhost backend');
}
console.log('[API Config]   Resolved API URL:', resolvedApiUrl);
console.log('[API Config] ============================================');

export const API_CONFIG = {
  /** Default API base URL. */
  BASE_URL: resolvedApiUrl,
  
  /** Request timeout in milliseconds (0 = no timeout for long-running jobs). */
  TIMEOUT: 0,
} as const;

/**
 * File upload configuration constants.
 */
export const UPLOAD_CONFIG = {
  /** Maximum number of files allowed per upload. */
  MAX_FILES: 1,
} as const;

/**
 * UI configuration constants.
 */
export const UI_CONFIG = {
  /** Copy feedback timeout in milliseconds. */
  COPY_FEEDBACK_TIMEOUT_MS: 2000,
} as const;

/**
 * File size formatting constants.
 */
export const FILE_SIZE_CONFIG = {
  /** Bytes conversion factor. */
  BYTES_PER_KB: 1024,
  
  /** File size unit labels. */
  UNITS: ['Bytes', 'KB', 'MB', 'GB'] as const,
} as const;
