/**
 * File validation utilities for audio file uploads.
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */

import { APP_CONFIG, ERROR_MESSAGES } from './constants';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate audio file against size and format constraints.
 * 
 * @param file file to validate
 * @returns validation result with isValid flag and optional error message
 */
export const validateAudioFile = (file: File): ValidationResult => {
  if (!file) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.FILE_REQUIRED,
    };
  }

  if (file.size > APP_CONFIG.maxFileSize) {
    const maxSizeFormatted = formatFileSize(APP_CONFIG.maxFileSize);
    return {
      isValid: false,
      error: `File size must be ${maxSizeFormatted} or less (current: ${formatFileSize(file.size)})`,
    };
  }

  const extension = getFileExtension(file.name);
  if (!extension || !APP_CONFIG.supportedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.INVALID_FORMAT,
    };
  }

  // Validate MIME type if available
  if (file.type) {
    const isValidMimeType = 
      file.type.startsWith('audio/') || 
      file.type.startsWith('video/') || 
      APP_CONFIG.supportedFormats.includes(file.type);
    
    if (!isValidMimeType) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.INVALID_FORMAT,
      };
    }
  }

  return { isValid: true };
};

/**
 * Extract file extension from filename.
 * 
 * @param filename filename with or without path
 * @returns file extension in lowercase with leading dot, or empty string
 */
export const getFileExtension = (filename: string): string => {
  if (!filename || !filename.includes('.')) {
    return '';
  }
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
    return '';
  }
  return filename.toLowerCase().substring(lastDotIndex);
};

/**
 * Format file size in bytes to human-readable format (Bytes, KB, MB, GB).
 * 
 * @param bytes file size in bytes
 * @returns formatted size string
 */
import { FILE_SIZE_CONFIG } from './constants';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = FILE_SIZE_CONFIG.BYTES_PER_KB;
  const sizes = FILE_SIZE_CONFIG.UNITS;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get display name for MIME type.
 * 
 * @param mimeType MIME type string
 * @returns display name or original MIME type if not mapped
 */
export const getFileTypeDisplayName = (mimeType: string): string => {
  const typeMap: Record<string, string> = {
    'audio/mpeg': 'MP3',
    'audio/wav': 'WAV',
    'audio/mp4': 'M4A',
    'audio/flac': 'FLAC',
    'audio/ogg': 'OGG',
    'audio/x-ms-wma': 'WMA',
    'audio/aac': 'AAC',
    'video/mp4': 'MP4',
    'video/x-msvideo': 'AVI',
    'video/quicktime': 'MOV',
    'video/x-matroska': 'MKV',
    'video/x-flv': 'FLV',
    'video/webm': 'WEBM',
    'video/x-ms-wmv': 'WMV',
    'video/3gpp': '3GP',
  };

  return typeMap[mimeType] || mimeType;
};

/**
 * Check if file is an audio or video file.
 * 
 * @param file file to check
 * @returns true if file is audio or video format
 */
export const isAudioFile = (file: File): boolean => {
  // Check by MIME type if available
  if (file.type) {
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      return true;
    }
  }
  
  // Fallback to extension check
  return APP_CONFIG.supportedExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
};
