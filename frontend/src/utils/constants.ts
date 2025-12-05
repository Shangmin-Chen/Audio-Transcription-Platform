// Single source of truth for configuration
// Environment variables can override defaults, but defaults are defined here
const getMaxFileSize = (): number => {
  // Allow override via env var, but default to 1GB
  const envSize = process.env.REACT_APP_MAX_FILE_SIZE;
  if (envSize) {
    const sizeMB = parseInt(envSize, 10);
    if (!isNaN(sizeMB) && sizeMB > 0) {
      return sizeMB * 1024 * 1024;
    }
  }
  return 1000 * 1024 * 1024; // Default: 1GB - production-ready limit
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
  FILE_TOO_LARGE: 'File size must be less than 1GB',
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
 */
export const TRANSCRIPTION_CONFIG = {
  /** Poll interval for job progress checks in milliseconds. */
  POLL_INTERVAL_MS: 1000,
  
  /** Maximum poll attempts (5 minutes at 1 second intervals). */
  MAX_POLL_ATTEMPTS: 300,
} as const;

/**
 * API configuration constants.
 */
export const API_CONFIG = {
  /** Default API base URL. */
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  
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
