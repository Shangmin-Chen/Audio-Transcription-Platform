package com.shangmin.whisperrr.service;

import com.shangmin.whisperrr.dto.JobProgressResponse;
import com.shangmin.whisperrr.dto.JobSubmissionResponse;
import com.shangmin.whisperrr.dto.TranscriptionResultResponse;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service interface for audio transcription operations.
 * 
 * <p>This interface defines the contract for audio transcription services,
 * including direct transcription, asynchronous job submission, and job progress
 * tracking. Implementations handle communication with the Python transcription
 * service and provide validation and error handling.</p>
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */
public interface AudioService {
    /**
     * Transcribe audio file synchronously.
     * 
     * @param audioFile the audio file to transcribe
     * @param modelSize optional Whisper model size (e.g., "base", "large")
     * @return transcription result with text, language, confidence, etc.
     * @throws com.shangmin.whisperrr.exception.FileValidationException if file validation fails
     * @throws com.shangmin.whisperrr.exception.TranscriptionProcessingException if transcription fails
     */
    TranscriptionResultResponse transcribeAudio(MultipartFile audioFile, String modelSize);
    
    /**
     * Submit a transcription job for asynchronous processing.
     * 
     * @param audioFile the audio file to transcribe
     * @param modelSize optional Whisper model size
     * @return job submission response with job ID and status
     * @throws com.shangmin.whisperrr.exception.FileValidationException if file validation fails
     * @throws com.shangmin.whisperrr.exception.TranscriptionProcessingException if job submission fails
     */
    JobSubmissionResponse submitTranscriptionJob(MultipartFile audioFile, String modelSize);
    
    /**
     * Get the progress of a transcription job.
     * 
     * @param jobId the job ID to check
     * @return job progress response with status, progress percentage, and result if completed
     * @throws com.shangmin.whisperrr.exception.TranscriptionProcessingException if job not found or error occurs
     */
    JobProgressResponse getJobProgress(String jobId);
    
    /**
     * Validate an audio file before processing.
     * 
     * @param audioFile the audio file to validate
     * @throws com.shangmin.whisperrr.exception.FileValidationException if validation fails
     */
    void validateAudioFile(MultipartFile audioFile);
}
