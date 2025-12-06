package com.shangmin.whisperrr.exception;

import com.shangmin.whisperrr.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.ConcurrentModificationException;

/**
 * Global exception handler with correlation ID support and sanitized error messages.
 * 
 * <p>This class provides centralized exception handling for all controllers,
 * ensuring consistent error responses across the application. It includes
 * correlation ID tracking for request tracing and sanitizes error messages
 * to prevent information leakage.</p>
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */
@ControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    /**
     * Get correlation ID from request context or MDC.
     * 
     * @param request the HTTP request
     * @return correlation ID, or "unknown" if not found
     */
    private String getCorrelationId(HttpServletRequest request) {
        String correlationId = MDC.get("correlationId");
        if (correlationId == null) {
            correlationId = (String) request.getAttribute("correlationId");
        }
        return correlationId != null ? correlationId : "unknown";
    }
    
    /**
     * Sanitize error messages to prevent information leakage.
     * 
     * @param message the error message to sanitize
     * @return sanitized error message
     */
    private String sanitizeErrorMessage(String message) {
        if (message == null) return "An error occurred";
        return message.replaceAll("(/[^\\s]+)", "[path]")
                     .replaceAll("(at [^\\s]+\\.[^\\s]+)", "[location]")
                     .replaceAll("(Exception|Error):", "");
    }
    
    @ExceptionHandler(FileValidationException.class)
    public ResponseEntity<ErrorResponse> handleFileValidationException(
            FileValidationException ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        logger.warn("File validation error [{}]: {}", correlationId, ex.getMessage());
        ErrorResponse error = new ErrorResponse(
            "FILE_VALIDATION_ERROR",
            sanitizeErrorMessage(ex.getMessage()),
            LocalDateTime.now(),
            correlationId
        );
        return ResponseEntity.badRequest().body(error);
    }
    
    @ExceptionHandler(TranscriptionProcessingException.class)
    public ResponseEntity<ErrorResponse> handleTranscriptionProcessingException(
            TranscriptionProcessingException ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        logger.error("Transcription processing error [{}]: {}", correlationId, ex.getMessage(), ex);
        ErrorResponse error = new ErrorResponse(
            "TRANSCRIPTION_PROCESSING_ERROR",
            "Transcription processing failed. Please try again later.",
            LocalDateTime.now(),
            correlationId
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        logger.warn("Validation error [{}]: {}", correlationId, ex.getMessage());
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .findFirst()
            .orElse("Validation failed");
        
        ErrorResponse error = new ErrorResponse(
            "VALIDATION_ERROR",
            sanitizeErrorMessage(message),
            LocalDateTime.now(),
            correlationId
        );
        return ResponseEntity.badRequest().body(error);
    }
    
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceededException(
            MaxUploadSizeExceededException ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        logger.warn("File size exceeded limit [{}]: {}", correlationId, ex.getMessage());
        ErrorResponse error = new ErrorResponse(
            "FILE_SIZE_EXCEEDED",
            "File size exceeds the maximum allowed limit of 50MB",
            LocalDateTime.now(),
            correlationId
        );
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(error);
    }
    
    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<ErrorResponse> handleResourceAccessException(
            ResourceAccessException ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        logger.error("Failed to access transcription service [{}]: {}", correlationId, ex.getMessage(), ex);
        ErrorResponse error = new ErrorResponse(
            "SERVICE_UNAVAILABLE",
            "Transcription service is currently unavailable. Please try again later.",
            LocalDateTime.now(),
            correlationId
        );
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
    }
    
    @ExceptionHandler(HttpClientErrorException.class)
    public ResponseEntity<ErrorResponse> handleHttpClientErrorException(
            HttpClientErrorException ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        logger.warn("Client error from transcription service [{}] ({}): {}", 
            correlationId, ex.getStatusCode(), ex.getMessage());
        ErrorResponse error = new ErrorResponse(
            "TRANSCRIPTION_SERVICE_ERROR",
            "Transcription service returned an error. Please check your request and try again.",
            LocalDateTime.now(),
            correlationId
        );
        return ResponseEntity.status(ex.getStatusCode()).body(error);
    }
    
    @ExceptionHandler(HttpServerErrorException.class)
    public ResponseEntity<ErrorResponse> handleHttpServerErrorException(
            HttpServerErrorException ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        logger.error("Server error from transcription service [{}] ({}): {}", 
            correlationId, ex.getStatusCode(), ex.getMessage(), ex);
        ErrorResponse error = new ErrorResponse(
            "TRANSCRIPTION_SERVICE_ERROR",
            "Transcription service encountered an error. Please try again later.",
            LocalDateTime.now(),
            correlationId
        );
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(error);
    }
    
    @ExceptionHandler(ConcurrentModificationException.class)
    public ResponseEntity<ErrorResponse> handleConcurrentModificationException(
            ConcurrentModificationException ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        logger.warn("Concurrent modification [{}]: {}", correlationId, ex.getMessage());
        ErrorResponse error = new ErrorResponse(
            "CONCURRENT_MODIFICATION",
            "A concurrent modification was detected. Please retry your request.",
            LocalDateTime.now(),
            correlationId
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, HttpServletRequest request) {
        String correlationId = getCorrelationId(request);
        logger.error("Unexpected error occurred [{}]: {}", correlationId, ex.getMessage(), ex);
        ErrorResponse error = new ErrorResponse(
            "INTERNAL_SERVER_ERROR",
            "An unexpected error occurred",
            LocalDateTime.now(),
            correlationId
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
