package com.shangmin.whisperrr.controller;

import com.shangmin.whisperrr.dto.JobProgressResponse;
import com.shangmin.whisperrr.dto.JobSubmissionResponse;
import com.shangmin.whisperrr.dto.TranscriptionResultResponse;
import com.shangmin.whisperrr.service.AudioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST controller for audio transcription endpoints.
 * 
 * <p>This controller provides HTTP endpoints for audio transcription operations,
 * including direct transcription, asynchronous job submission, and job progress
 * tracking. It handles multipart file uploads and delegates business logic to
 * the AudioService.</p>
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */
@RestController
@RequestMapping("/api/audio")
public class AudioController {
    
    private final AudioService audioService;
    
    @Autowired
    public AudioController(AudioService audioService) {
        this.audioService = audioService;
    }
    
    /**
     * Transcribe audio file synchronously.
     * 
     * @param audioFile the audio file to transcribe
     * @param modelSize optional Whisper model size
     * @return transcription result response
     */
    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TranscriptionResultResponse> transcribeAudio(
            @RequestParam("audioFile") @Valid MultipartFile audioFile,
            @RequestParam(value = "modelSize", required = false) String modelSize) {
        TranscriptionResultResponse response = audioService.transcribeAudio(audioFile, modelSize);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Submit a transcription job for asynchronous processing.
     * 
     * @param audioFile the audio file to transcribe
     * @param modelSize optional Whisper model size
     * @return job submission response with job ID
     */
    @PostMapping(value = "/jobs/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<JobSubmissionResponse> submitTranscriptionJob(
            @RequestParam("audioFile") @Valid MultipartFile audioFile,
            @RequestParam(value = "modelSize", required = false) String modelSize) {
        JobSubmissionResponse response = audioService.submitTranscriptionJob(audioFile, modelSize);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get the progress of a transcription job.
     * 
     * @param jobId the job ID
     * @return job progress response
     */
    @GetMapping("/jobs/{jobId}/progress")
    public ResponseEntity<JobProgressResponse> getJobProgress(@PathVariable String jobId) {
        JobProgressResponse response = audioService.getJobProgress(jobId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Health check endpoint.
     * 
     * @return "OK" if service is healthy
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("OK");
    }
}
