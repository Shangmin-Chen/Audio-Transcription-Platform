/**
 * API Configuration and Base HTTP Client for Whisperrr Frontend.
 * 
 * This module provides the core HTTP client configuration and setup for
 * communicating with the Whisperrr backend API. It includes request/response
 * interceptors, error handling, and environment-based configuration.
 * 
 * Key Features:
 *   - Environment-based configuration with sensible defaults
 *   - Request and response interceptors for logging and error handling
 *   - Timeout configuration for reliable network operations
 *   - CORS-enabled communication with Spring Boot backend
 *   - Centralized error handling and logging
 * 
 * Configuration Sources:
 *   - REACT_APP_API_URL: Backend API base URL (default: http://localhost:7331/api)
 *   - Environment variables override defaults for different deployments
 * 
 * Network Configuration:
 *   - 30-second timeout for all requests
 *   - JSON content type by default
 *   - Automatic request/response logging
 *   - Error response handling with detailed logging
 * 
 * Usage:
 *   ```typescript
 *   import apiClient from './api';
 *   
 *   // Make API calls
 *   const response = await apiClient.post('/audio/transcribe', formData);
 *   ```
 * 
 * Error Handling:
 *   - Automatic logging of request and response details
 *   - Structured error information for debugging
 *   - Network timeout handling
 *   - HTTP status code error mapping
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */

import axios, { AxiosInstance } from 'axios';

import { API_CONFIG as API_CONSTANTS } from '../utils/constants';

/**
 * API configuration object with environment-based settings.
 * 
 * This configuration provides flexible settings that can be overridden
 * via environment variables for different deployment environments
 * (development, staging, production).
 */
export const API_CONFIG = {
  /** Base URL for the backend API */
  baseURL: API_CONSTANTS.BASE_URL,
  /** Request timeout in milliseconds - set to 0 for no timeout (for long-running transcription jobs) */
  timeout: API_CONSTANTS.TIMEOUT,
};

/**
 * Create configured axios instance for API communication.
 * 
 * This instance is pre-configured with base URL, timeout, and default headers
 * for consistent communication with the Whisperrr backend API. It includes
 * interceptors for request/response logging and error handling.
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Log API client initialization
console.log('[API Client] Initialized with base URL:', API_CONFIG.baseURL);

/**
 * Request interceptor for logging and authentication.
 * 
 * This interceptor runs before every request is sent to the server.
 * It provides request logging for debugging and can be extended to
 * add authentication tokens or other request modifications.
 * 
 * Features:
 *   - Request method and URL logging
 *   - Future authentication token injection point
 *   - Request timing and debugging information
 *   - Error handling for request setup failures
 */
apiClient.interceptors.request.use(
  (config) => {
    // Log request details for debugging
    const fullUrl = config.baseURL ? `${config.baseURL}${config.url || ''}` : config.url;
    console.log(`[API Client] ${config.method?.toUpperCase()} ${fullUrl}`);
    
    // Add any auth tokens here if needed
    // config.headers.Authorization = `Bearer ${getAuthToken()}`;
    
    return config;
  },
  (error) => {
    console.error('[API Client] Request setup error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for logging and error handling.
 * 
 * This interceptor processes all responses from the server, providing
 * consistent logging and error handling across the application. It
 * helps with debugging and provides structured error information.
 * 
 * Features:
 *   - Response status and URL logging
 *   - Structured error information extraction
 *   - Network error handling
 *   - Response timing information
 *   - Automatic error message formatting
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Client] ✓ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error(`[API Client] ✗ ${error.response.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      console.error('[API Client] Error response:', error.response.data);
    } else if (error.request) {
      // Request made but no response received
      const url = error.config?.baseURL ? `${error.config.baseURL}${error.config.url || ''}` : error.config?.url;
      console.error(`[API Client] ✗ No response received for ${error.config?.method?.toUpperCase()} ${url}`);
      console.error('[API Client] Network error - check if backend is running and accessible');
      console.error('[API Client] Configured base URL:', API_CONFIG.baseURL);
    } else {
      // Error setting up request
      console.error('[API Client] Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
