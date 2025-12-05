/**
 * Formatting utilities for displaying transcription data.
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */

/**
 * Format duration in seconds to human-readable format (HH:MM:SS or MM:SS).
 * 
 * @param seconds duration in seconds
 * @returns formatted duration string
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Format timestamp to localized date/time string.
 * 
 * @param timestamp ISO timestamp string
 * @returns formatted date/time string
 */
export const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Format processing time in milliseconds to human-readable format.
 * 
 * @param milliseconds processing time in milliseconds
 * @returns formatted time string (e.g., "2.5s", "1m 30s")
 */
export const formatProcessingTime = (milliseconds: number): string => {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  const remainingMs = milliseconds % 1000;
  
  if (seconds < 60) {
    return `${seconds}.${Math.floor(remainingMs / 100)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}m ${remainingSeconds}s`;
};

/**
 * Format confidence score as percentage.
 * 
 * @param confidence confidence score (0-1) or undefined
 * @returns formatted percentage string or "N/A"
 */
export const formatConfidence = (confidence?: number): string => {
  if (confidence === undefined || confidence === null) {
    return 'N/A';
  }
  
  return `${Math.round(confidence * 100)}%`;
};

/**
 * Format file size in bytes to megabytes.
 * 
 * @param bytes file size in bytes
 * @returns formatted size string in MB
 */
export const formatFileSizeMB = (bytes: number): string => {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
};

/**
 * Truncate text to maximum length with ellipsis.
 * 
 * @param text text to truncate
 * @param maxLength maximum length
 * @returns truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Format segment time in seconds to MM:SS.mmm format.
 * 
 * @param timeInSeconds time in seconds
 * @returns formatted time string
 */
export const formatSegmentTime = (timeInSeconds: number): string => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
};

/**
 * Capitalize first letter of string and lowercase the rest.
 * 
 * @param str string to capitalize
 * @returns capitalized string
 */
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Format status string by capitalizing words separated by underscores.
 * 
 * @param status status string (e.g., "FILE_VALIDATION_ERROR")
 * @returns formatted status string (e.g., "File Validation Error")
 */
export const formatStatus = (status: string): string => {
  return status.split('_').map(capitalize).join(' ');
};
