package com.shangmin.whisperrr.controller;

import com.shangmin.whisperrr.dto.TranscriptionResultResponse;
import com.shangmin.whisperrr.exception.FileValidationException;
import com.shangmin.whisperrr.exception.TranscriptionProcessingException;
import com.shangmin.whisperrr.service.AudioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AudioController covering all failure scenarios.
 * 
 * These tests verify that the controller properly:
 * - Delegates to service layer
 * - Handles service exceptions
 * - Returns appropriate HTTP status codes
 * - Validates request parameters
 */
@ExtendWith(MockitoExtension.class)
class AudioControllerTest {

    @Mock(lenient = true)
    private AudioService audioService;

    @InjectMocks
    private AudioController audioController;

    @Mock(lenient = true)
    private MultipartFile mockFile;

    // ========== Direct Transcription Tests ==========

    @Test
    void testTranscribeAudio_WithValidFile_ReturnsOk() {
        TranscriptionResultResponse response = new TranscriptionResultResponse();
        response.setTranscriptionText("Test transcription");
        
        when(audioService.transcribeAudio(any(), any())).thenReturn(response);
        when(mockFile.getOriginalFilename()).thenReturn("test.mp3");
        
        ResponseEntity<TranscriptionResultResponse> result = 
            audioController.transcribeAudio(mockFile, null);
        
        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertNotNull(result.getBody());
        verify(audioService).transcribeAudio(mockFile, null);
    }

    @Test
    void testTranscribeAudio_WhenFileValidationFails_ThrowsException() {
        when(audioService.transcribeAudio(any(), any()))
            .thenThrow(new FileValidationException("Invalid file"));
        
        assertThrows(FileValidationException.class, () -> {
            audioController.transcribeAudio(mockFile, null);
        });
    }

    @Test
    void testTranscribeAudio_WhenServiceFails_ThrowsException() {
        when(audioService.transcribeAudio(any(), any()))
            .thenThrow(new TranscriptionProcessingException("Service error"));
        
        assertThrows(TranscriptionProcessingException.class, () -> {
            audioController.transcribeAudio(mockFile, null);
        });
    }

    @Test
    void testTranscribeAudio_WithModelSize_ForwardsToService() {
        TranscriptionResultResponse response = new TranscriptionResultResponse();
        when(audioService.transcribeAudio(any(), eq("large"))).thenReturn(response);
        when(mockFile.getOriginalFilename()).thenReturn("test.mp3");
        
        audioController.transcribeAudio(mockFile, "large");
        
        verify(audioService).transcribeAudio(mockFile, "large");
    }

    // ========== Health Check Tests ==========

    @Test
    void testHealth_ReturnsOk() {
        ResponseEntity<String> result = audioController.health();
        
        assertEquals(HttpStatus.OK, result.getStatusCode());
        assertEquals("OK", result.getBody());
    }

}

