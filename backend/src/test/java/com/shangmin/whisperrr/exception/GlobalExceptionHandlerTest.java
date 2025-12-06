package com.shangmin.whisperrr.exception;

import com.shangmin.whisperrr.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Unit tests for GlobalExceptionHandler to verify proper error handling.
 */
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    void testHandleFileValidationException_ReturnsBadRequest() {
        FileValidationException ex = new FileValidationException("Invalid file format");
        HttpServletRequest request = mock(HttpServletRequest.class);
        
        ResponseEntity<ErrorResponse> response = 
            exceptionHandler.handleFileValidationException(ex, request);
        
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("FILE_VALIDATION_ERROR", response.getBody().getError());
    }

    @Test
    void testHandleTranscriptionProcessingException_ReturnsInternalServerError() {
        TranscriptionProcessingException ex = 
            new TranscriptionProcessingException("Processing failed");
        HttpServletRequest request = mock(HttpServletRequest.class);
        
        ResponseEntity<ErrorResponse> response = 
            exceptionHandler.handleTranscriptionProcessingException(ex, request);
        
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("TRANSCRIPTION_PROCESSING_ERROR", response.getBody().getError());
    }

    @Test
    void testHandleMaxUploadSizeExceededException_ReturnsPayloadTooLarge() {
        MaxUploadSizeExceededException ex = 
            new MaxUploadSizeExceededException(50 * 1024 * 1024);
        HttpServletRequest request = mock(HttpServletRequest.class);
        
        ResponseEntity<ErrorResponse> response = 
            exceptionHandler.handleMaxUploadSizeExceededException(ex, request);
        
        assertEquals(HttpStatus.PAYLOAD_TOO_LARGE, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("FILE_SIZE_EXCEEDED", response.getBody().getError());
    }

    @Test
    void testHandleResourceAccessException_ReturnsServiceUnavailable() {
        ResourceAccessException ex = new ResourceAccessException("Connection refused");
        HttpServletRequest request = mock(HttpServletRequest.class);
        
        ResponseEntity<ErrorResponse> response = 
            exceptionHandler.handleResourceAccessException(ex, request);
        
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("SERVICE_UNAVAILABLE", response.getBody().getError());
    }

    @Test
    void testHandleHttpClientErrorException_ReturnsClientErrorStatus() {
        HttpClientErrorException ex = new HttpClientErrorException(
            HttpStatus.BAD_REQUEST, "Bad request"
        );
        HttpServletRequest request = mock(HttpServletRequest.class);
        
        ResponseEntity<ErrorResponse> response = 
            exceptionHandler.handleHttpClientErrorException(ex, request);
        
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("TRANSCRIPTION_SERVICE_ERROR", response.getBody().getError());
    }

    @Test
    void testHandleHttpServerErrorException_ReturnsBadGateway() {
        HttpServerErrorException ex = new HttpServerErrorException(
            HttpStatus.INTERNAL_SERVER_ERROR, "Server error"
        );
        HttpServletRequest request = mock(HttpServletRequest.class);
        
        ResponseEntity<ErrorResponse> response = 
            exceptionHandler.handleHttpServerErrorException(ex, request);
        
        assertEquals(HttpStatus.BAD_GATEWAY, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("TRANSCRIPTION_SERVICE_ERROR", response.getBody().getError());
    }

    @Test
    void testHandleGenericException_ReturnsInternalServerError() {
        Exception ex = new RuntimeException("Unexpected error");
        HttpServletRequest request = mock(HttpServletRequest.class);
        
        ResponseEntity<ErrorResponse> response = 
            exceptionHandler.handleGenericException(ex, request);
        
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("INTERNAL_SERVER_ERROR", response.getBody().getError());
    }
}

