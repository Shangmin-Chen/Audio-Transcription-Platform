package com.shangmin.whisperrr.dto;

import java.time.LocalDateTime;

/**
 * DTO for error responses with correlation ID support.
 * 
 * <p>This class represents standardized error responses returned to clients.
 * It includes error type, sanitized message, timestamp, and correlation ID
 * for request tracking.</p>
 */
public class ErrorResponse {
    
    private String error;
    private String message;
    private LocalDateTime timestamp;
    private String correlationId;
    
    public ErrorResponse() {}
    
    public ErrorResponse(String error, String message, LocalDateTime timestamp) {
        this.error = error;
        this.message = message;
        this.timestamp = timestamp;
    }
    
    public ErrorResponse(String error, String message, LocalDateTime timestamp, String correlationId) {
        this.error = error;
        this.message = message;
        this.timestamp = timestamp;
        this.correlationId = correlationId;
    }
    
    public String getError() {
        return error;
    }
    
    public void setError(String error) {
        this.error = error;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
    
    public String getCorrelationId() {
        return correlationId;
    }
    
    public void setCorrelationId(String correlationId) {
        this.correlationId = correlationId;
    }
}
