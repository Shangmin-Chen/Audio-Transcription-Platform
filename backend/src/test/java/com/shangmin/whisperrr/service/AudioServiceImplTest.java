package com.shangmin.whisperrr.service;

import com.shangmin.whisperrr.dto.TranscriptionResultResponse;
import com.shangmin.whisperrr.exception.FileValidationException;
import com.shangmin.whisperrr.exception.TranscriptionProcessingException;
import com.shangmin.whisperrr.service.impl.AudioServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentCaptor;

/**
 * Comprehensive unit tests for AudioServiceImpl covering all failure scenarios.
 * 
 * These tests verify that the service properly handles:
 * - File validation failures
 * - Python service connection failures
 * - Invalid responses from Python service
 * - Network errors and timeouts
 * - Malformed data
 * - Edge cases and boundary conditions
 */
@ExtendWith(MockitoExtension.class)
class AudioServiceImplTest {
    
    @Mock(lenient = true)
    private RestTemplate restTemplate;

    @InjectMocks
    private AudioServiceImpl audioService;

    @Mock
    private MultipartFile mockFile;

    private static final String PYTHON_SERVICE_URL = "http://localhost:5001";
    private static final byte[] VALID_AUDIO_CONTENT = "fake audio content".getBytes();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(audioService, "pythonServiceUrl", PYTHON_SERVICE_URL);
        ReflectionTestUtils.setField(audioService, "restTemplate", restTemplate);
    }

    // ========== File Validation Tests ==========

    @Test
    void testTranscribeAudio_WithNullFile_ThrowsException() {
        assertThrows(FileValidationException.class, () -> {
            audioService.transcribeAudio(null, null);
        });
    }

    @Test
    void testTranscribeAudio_WithEmptyFile_ThrowsException() {
        when(mockFile.isEmpty()).thenReturn(true);
        
        assertThrows(FileValidationException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    @Test
    void testTranscribeAudio_WithFileTooLarge_ThrowsException() {
        when(mockFile.isEmpty()).thenReturn(false);
        when(mockFile.getSize()).thenReturn(60L * 1024 * 1024); // 60MB > 50MB limit
        
        assertThrows(FileValidationException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    @Test
    void testTranscribeAudio_WithNullFilename_ThrowsException() {
        when(mockFile.isEmpty()).thenReturn(false);
        when(mockFile.getSize()).thenReturn(1024L);
        when(mockFile.getOriginalFilename()).thenReturn(null);
        
        assertThrows(FileValidationException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    @Test
    void testTranscribeAudio_WithUnsupportedExtension_ThrowsException() throws IOException {
        lenient().when(mockFile.isEmpty()).thenReturn(false);
        lenient().when(mockFile.getSize()).thenReturn(1024L);
        lenient().when(mockFile.getOriginalFilename()).thenReturn("file.txt");
        lenient().when(mockFile.getContentType()).thenReturn("text/plain");
        
        assertThrows(FileValidationException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    @Test
    void testTranscribeAudio_WithInvalidContentType_ThrowsException() {
        when(mockFile.isEmpty()).thenReturn(false);
        when(mockFile.getSize()).thenReturn(1024L);
        when(mockFile.getOriginalFilename()).thenReturn("audio.mp3");
        when(mockFile.getContentType()).thenReturn("application/json");
        
        assertThrows(FileValidationException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    @Test
    void testTranscribeAudio_WithNoExtension_ThrowsException() throws IOException {
        lenient().when(mockFile.isEmpty()).thenReturn(false);
        lenient().when(mockFile.getSize()).thenReturn(1024L);
        lenient().when(mockFile.getOriginalFilename()).thenReturn("audio");
        lenient().when(mockFile.getContentType()).thenReturn("audio/mpeg");
        
        assertThrows(FileValidationException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    // ========== Python Service Connection Failure Tests ==========

    @Test
    void testTranscribeAudio_WhenPythonServiceUnavailable_ThrowsException() throws IOException {
        setupValidFile();
        
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new ResourceAccessException("Connection refused"));
        
        assertThrows(TranscriptionProcessingException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    @Test
    void testTranscribeAudio_WhenPythonServiceTimeout_ThrowsException() throws IOException {
        setupValidFile();
        
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(new ResourceAccessException("Read timed out"));
        
        assertThrows(TranscriptionProcessingException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    // ========== Python Service Error Response Tests ==========

    @Test
    void testTranscribeAudio_WhenPythonServiceReturns400_ThrowsException() throws IOException {
        setupValidFile();
        
        HttpClientErrorException exception = new HttpClientErrorException(
            HttpStatus.BAD_REQUEST, "Invalid request"
        );
        
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(exception);
        
        assertThrows(TranscriptionProcessingException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    @Test
    void testTranscribeAudio_WhenPythonServiceReturns413_ThrowsException() throws IOException {
        setupValidFile();
        
        HttpClientErrorException exception = new HttpClientErrorException(
            HttpStatus.PAYLOAD_TOO_LARGE, "File too large"
        );
        
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(exception);
        
        assertThrows(TranscriptionProcessingException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    @Test
    void testTranscribeAudio_WhenPythonServiceReturns500_ThrowsException() throws IOException {
        setupValidFile();
        
        HttpServerErrorException exception = new HttpServerErrorException(
            HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error"
        );
        
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(exception);
        
        assertThrows(TranscriptionProcessingException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    @Test
    void testTranscribeAudio_WhenPythonServiceReturns503_ThrowsException() throws IOException {
        setupValidFile();
        
        HttpServerErrorException exception = new HttpServerErrorException(
            HttpStatus.SERVICE_UNAVAILABLE, "Service unavailable"
        );
        
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenThrow(exception);
        
        assertThrows(TranscriptionProcessingException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    // ========== Invalid Response Tests ==========

    @Test
    void testTranscribeAudio_WhenResponseIsNull_ThrowsException() throws IOException {
        setupValidFile();
        
        ResponseEntity<Map> response = new ResponseEntity<>(null, HttpStatus.OK);
        
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(response);
        
        assertThrows(TranscriptionProcessingException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    @Test
    void testTranscribeAudio_WhenResponseBodyIsNull_ThrowsException() throws IOException {
        setupValidFile();
        
        ResponseEntity<Map> response = ResponseEntity.ok(null);
        
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(response);
        
        assertThrows(TranscriptionProcessingException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    @Test
    void testTranscribeAudio_WhenResponseHasEmptyText_ThrowsException() throws IOException {
        setupValidFile();
        
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("text", "");
        responseBody.put("language", "en");
        
        ResponseEntity<Map> response = ResponseEntity.ok(responseBody);
        
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(response);
        
        assertThrows(TranscriptionProcessingException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    @Test
    void testTranscribeAudio_WhenResponseMissingText_ThrowsException() throws IOException {
        setupValidFile();
        
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("language", "en");
        // Missing "text" field
        
        ResponseEntity<Map> response = ResponseEntity.ok(responseBody);
        
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(response);
        
        assertThrows(TranscriptionProcessingException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    @Test
    void testTranscribeAudio_WhenResponseHasNullText_ThrowsException() throws IOException {
        setupValidFile();
        
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("text", null);
        responseBody.put("language", "en");
        
        ResponseEntity<Map> response = ResponseEntity.ok(responseBody);
        
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(response);
        
        assertThrows(TranscriptionProcessingException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    // ========== Malformed Response Tests ==========

    @Test
    void testTranscribeAudio_WhenConfidenceIsInvalidType_HandlesGracefully() throws IOException {
        setupValidFile();
        
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("text", "Transcribed text");
        responseBody.put("language", "en");
        responseBody.put("confidence_score", "invalid"); // Should be Number
        
        ResponseEntity<Map> response = ResponseEntity.ok(responseBody);
        
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(response);
        
        // Should not throw, but handle gracefully
        assertDoesNotThrow(() -> {
            TranscriptionResultResponse result = audioService.transcribeAudio(mockFile, null);
            assertNotNull(result);
            assertNull(result.getConfidence()); // Should be null when invalid
        });
    }

    @Test
    void testTranscribeAudio_WhenDurationIsInvalidType_HandlesGracefully() throws IOException {
        setupValidFile();
        
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("text", "Transcribed text");
        responseBody.put("language", "en");
        responseBody.put("duration", "not a number");
        
        ResponseEntity<Map> response = ResponseEntity.ok(responseBody);
        
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(response);
        
        assertDoesNotThrow(() -> {
            TranscriptionResultResponse result = audioService.transcribeAudio(mockFile, null);
            assertNotNull(result);
        });
    }

    // ========== IOException Tests ==========

    @Test
    void testTranscribeAudio_WhenFileReadFails_ThrowsException() throws IOException {
        when(mockFile.isEmpty()).thenReturn(false);
        when(mockFile.getSize()).thenReturn(1024L);
        when(mockFile.getOriginalFilename()).thenReturn("audio.mp3");
        when(mockFile.getContentType()).thenReturn("audio/mpeg");
        
        when(mockFile.getBytes()).thenThrow(new IOException("Failed to read file"));
        
        assertThrows(TranscriptionProcessingException.class, () -> {
            audioService.transcribeAudio(mockFile, null);
        });
    }

    // ========== Successful Response Tests ==========

    @Test
    void testTranscribeAudio_WithValidResponse_ReturnsResult() throws IOException {
        setupValidFile();
        
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("text", "Hello world");
        responseBody.put("language", "en");
        responseBody.put("confidence_score", 0.95);
        responseBody.put("duration", 5.5);
        responseBody.put("model_used", "base");
        responseBody.put("processing_time", 2.3);
        
        ResponseEntity<Map> response = ResponseEntity.ok(responseBody);
        
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(response);
        
        TranscriptionResultResponse result = audioService.transcribeAudio(mockFile, null);
        
        assertNotNull(result);
        assertEquals("Hello world", result.getTranscriptionText());
        assertEquals("en", result.getLanguage());
        assertEquals(0.95, result.getConfidence());
        assertEquals(5.5, result.getDuration());
        assertEquals("base", result.getModelUsed());
    }

    @Test
    void testTranscribeAudio_WithModelSize_IncludesInRequest() throws IOException {
        setupValidFile();
        
        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("text", "Test");
        responseBody.put("language", "en");
        
        ResponseEntity<Map> response = ResponseEntity.ok(responseBody);
        
        when(restTemplate.postForEntity(anyString(), any(), eq(Map.class)))
            .thenReturn(response);
        
        audioService.transcribeAudio(mockFile, "large");
        
        // Verify URL includes model_size parameter - use ArgumentCaptor to capture actual URL
        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(restTemplate).postForEntity(
            urlCaptor.capture(),
            any(),
            eq(Map.class)
        );
        
        assertTrue(urlCaptor.getValue().contains("model_size=large"), 
            "URL should contain model_size=large, but was: " + urlCaptor.getValue());
    }

    // ========== Helper Methods ==========

    private void setupValidFile() throws IOException {
        when(mockFile.isEmpty()).thenReturn(false);
        when(mockFile.getSize()).thenReturn(1024L);
        when(mockFile.getOriginalFilename()).thenReturn("audio.mp3");
        when(mockFile.getContentType()).thenReturn("audio/mpeg");
        when(mockFile.getBytes()).thenReturn(VALID_AUDIO_CONTENT);
    }
}

