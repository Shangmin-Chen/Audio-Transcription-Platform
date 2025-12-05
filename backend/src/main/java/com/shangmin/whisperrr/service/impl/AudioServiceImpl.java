package com.shangmin.whisperrr.service.impl;

import com.shangmin.whisperrr.dto.JobProgressResponse;
import com.shangmin.whisperrr.dto.JobSubmissionResponse;
import com.shangmin.whisperrr.dto.TranscriptionResultResponse;
import com.shangmin.whisperrr.dto.TranscriptionStatus;
import com.shangmin.whisperrr.exception.FileValidationException;
import com.shangmin.whisperrr.exception.TranscriptionProcessingException;
import com.shangmin.whisperrr.config.AppConfig;
import com.shangmin.whisperrr.service.AudioService;
import com.shangmin.whisperrr.util.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import jakarta.annotation.PostConstruct;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Service implementation for audio transcription operations.
 * 
 * <p>This service handles communication with the Python transcription service,
 * validates audio files, and transforms responses for the frontend. It acts as
 * a proxy layer between the frontend and Python service, providing validation,
 * error handling, and response transformation.</p>
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */
@Service
public class AudioServiceImpl implements AudioService {
    
    private static final Logger logger = LoggerFactory.getLogger(AudioServiceImpl.class);
    
    private RestTemplate restTemplate;
    
    @Value("${whisperrr.service.url}")
    private String pythonServiceUrl;
    
    @Value("${whisperrr.service.connect-timeout:5000}")
    private int connectTimeout;
    
    /**
     * Initialize RestTemplate with connection timeout configuration.
     */
    @PostConstruct
    public void initRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        this.restTemplate = new RestTemplate(factory);
    }
    
    @Override
    public TranscriptionResultResponse transcribeAudio(MultipartFile audioFile, String modelSize) {
        validateAudioFile(audioFile);
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            
            String filename = SecurityUtils.sanitizeFilename(audioFile.getOriginalFilename());
            if (filename == null) {
                filename = "audio_file." + SecurityUtils.getFileExtension(audioFile.getOriginalFilename());
            }
            
            final String safeFilename = filename;
            final byte[] fileBytes = audioFile.getBytes();
            
            body.add("file", new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return safeFilename;
                }
            });
            
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            
            UriComponentsBuilder urlBuilder = UriComponentsBuilder.fromHttpUrl(pythonServiceUrl + "/transcribe");
            if (modelSize != null && !modelSize.trim().isEmpty()) {
                urlBuilder.queryParam("model_size", modelSize);
            }
            String transcribeUrl = urlBuilder.toUriString();
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                transcribeUrl, 
                requestEntity, 
                Map.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                
                String transcriptionText = extractTranscriptionText(result);
                if (transcriptionText.isEmpty()) {
                    throw new TranscriptionProcessingException("Python service returned empty transcription result");
                }
                
                TranscriptionResultResponse resultResponse = new TranscriptionResultResponse();
                resultResponse.setTranscriptionText(transcriptionText);
                resultResponse.setLanguage(String.valueOf(result.getOrDefault("language", "unknown")));
                resultResponse.setConfidence(extractDoubleSafely(result.get("confidence_score")));
                resultResponse.setDuration(extractDoubleSafely(result.get("duration")));
                resultResponse.setModelUsed(String.valueOf(result.getOrDefault("model_used", "unknown")));
                resultResponse.setProcessingTime(extractDoubleSafely(result.get("processing_time")));
                resultResponse.setCompletedAt(LocalDateTime.now());
                resultResponse.setStatus(TranscriptionStatus.COMPLETED);
                
                return resultResponse;
            } else {
                throw new TranscriptionProcessingException("Python service returned unexpected response: " + 
                    (response.getStatusCode() != null ? response.getStatusCode() : "null status"));
            }
            
        } catch (ResourceAccessException e) {
            logger.error("Failed to connect to Python service: {}", e.getMessage(), e);
            throw new TranscriptionProcessingException("Transcription service is unavailable", e);
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            String responseBody = e.getResponseBodyAsString();
            logger.error("Python service error ({}): {}. Response: {}", 
                e.getStatusCode(), e.getMessage(), responseBody, e);
            throw new TranscriptionProcessingException("Transcription service error: " + e.getStatusCode(), e);
        } catch (TranscriptionProcessingException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Transcription failed: {}", e.getMessage(), e);
            throw new TranscriptionProcessingException("Transcription failed: " + e.getMessage(), e);
        }
    }
    
    @Override
    public void validateAudioFile(MultipartFile audioFile) {
        if (audioFile == null || audioFile.isEmpty()) {
            throw new FileValidationException("Audio file is required");
        }
        
        if (audioFile.getSize() > AppConfig.MAX_FILE_SIZE_BYTES) {
            throw new FileValidationException("File size exceeds maximum allowed size of " + AppConfig.MAX_FILE_SIZE_MB + "MB");
        }
        
        String originalFilename = audioFile.getOriginalFilename();
        if (originalFilename == null) {
            throw new FileValidationException("File must have a valid name");
        }
        
        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!AppConfig.SUPPORTED_EXTENSIONS.contains(extension)) {
            throw new FileValidationException("Unsupported file type. Supported types: " + AppConfig.SUPPORTED_EXTENSIONS);
        }
        
        String contentType = audioFile.getContentType();
        if (contentType == null || (!contentType.startsWith("audio/") && !contentType.startsWith("video/"))) {
            throw new FileValidationException("File must be an audio or video file");
        }
    }
    
    /**
     * Extract transcription text from Python service response.
     * 
     * @param result the response map from Python service
     * @return extracted transcription text, or empty string if not found
     */
    private String extractTranscriptionText(Map<String, Object> result) {
        Object textObj = result.get("text");
        String text = textObj != null ? String.valueOf(textObj).trim() : "";
        
        if (text.isEmpty()) {
            Object segmentsObj = result.get("segments");
            if (segmentsObj instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                java.util.List<Map<String, Object>> segments = (java.util.List<Map<String, Object>>) segmentsObj;
                if (segments != null && !segments.isEmpty()) {
                    StringBuilder textBuilder = new StringBuilder();
                    for (Map<String, Object> segment : segments) {
                        String segText = segment.get("text") != null ? String.valueOf(segment.get("text")).trim() : "";
                        if (!segText.isEmpty()) {
                            if (textBuilder.length() > 0) textBuilder.append(" ");
                            textBuilder.append(segText);
                        }
                    }
                    text = textBuilder.toString();
                }
            }
        }
        return text;
    }
    
    /**
     * Safely extract a double value from a response object.
     * 
     * @param value the value to extract
     * @return double value, or null if extraction fails
     */
    private Double extractDoubleSafely(Object value) {
        if (value == null) return null;
        try {
            return value instanceof Number ? ((Number) value).doubleValue() : null;
        } catch (ClassCastException e) {
            logger.warn("Failed to extract double value from: {}", value, e);
            return null;
        }
    }
    
    /**
     * Extract file extension from filename.
     * 
     * @param filename the filename
     * @return file extension in lowercase, or empty string if no extension
     */
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex == -1 ? "" : filename.substring(lastDotIndex + 1);
    }
    
    @Override
    public JobSubmissionResponse submitTranscriptionJob(MultipartFile audioFile, String modelSize) {
        validateAudioFile(audioFile);
        
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            
            String filename = SecurityUtils.sanitizeFilename(audioFile.getOriginalFilename());
            if (filename == null) {
                filename = "audio_file." + SecurityUtils.getFileExtension(audioFile.getOriginalFilename());
            }
            
            final String safeFilename = filename;
            final byte[] fileBytes = audioFile.getBytes();
            
            body.add("file", new ByteArrayResource(fileBytes) {
                @Override
                public String getFilename() {
                    return safeFilename;
                }
            });
            
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            
            UriComponentsBuilder urlBuilder = UriComponentsBuilder.fromHttpUrl(pythonServiceUrl + "/jobs/submit");
            if (modelSize != null && !modelSize.trim().isEmpty()) {
                urlBuilder.queryParam("model_size", modelSize);
            }
            String submitUrl = urlBuilder.toUriString();
            
            ResponseEntity<Map> response = restTemplate.postForEntity(
                submitUrl, 
                requestEntity, 
                Map.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                
                JobSubmissionResponse submissionResponse = new JobSubmissionResponse();
                submissionResponse.setJobId(String.valueOf(result.get("job_id")));
                submissionResponse.setStatus(String.valueOf(result.get("status")));
                submissionResponse.setMessage(String.valueOf(result.getOrDefault("message", "Job submitted")));
                
                return submissionResponse;
            } else {
                throw new TranscriptionProcessingException("Python service returned unexpected response: " + 
                    (response.getStatusCode() != null ? response.getStatusCode() : "null status"));
            }
            
        } catch (ResourceAccessException e) {
            logger.error("Failed to connect to Python service: {}", e.getMessage(), e);
            throw new TranscriptionProcessingException("Transcription service is unavailable", e);
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            String responseBody = e.getResponseBodyAsString();
            logger.error("Python service error ({}): {}. Response: {}", 
                e.getStatusCode(), e.getMessage(), responseBody, e);
            throw new TranscriptionProcessingException("Transcription service error: " + e.getStatusCode(), e);
        } catch (TranscriptionProcessingException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Job submission failed: {}", e.getMessage(), e);
            throw new TranscriptionProcessingException("Job submission failed: " + e.getMessage(), e);
        }
    }
    
    @Override
    public JobProgressResponse getJobProgress(String jobId) {
        try {
            String progressUrl = pythonServiceUrl + "/jobs/" + jobId + "/progress";
            
            ResponseEntity<Map> response = restTemplate.getForEntity(progressUrl, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                
                JobProgressResponse progressResponse = new JobProgressResponse();
                progressResponse.setJobId(String.valueOf(result.get("job_id")));
                progressResponse.setStatus(String.valueOf(result.get("status")));
                
                Object progressObj = result.get("progress");
                if (progressObj != null) {
                    progressResponse.setProgress(progressObj instanceof Number ? 
                        ((Number) progressObj).doubleValue() : Double.parseDouble(String.valueOf(progressObj)));
                }
                
                progressResponse.setMessage(String.valueOf(result.getOrDefault("message", "")));
                
                // If job is completed, include result
                Object resultObj = result.get("result");
                if (resultObj != null && resultObj instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> resultMap = (Map<String, Object>) resultObj;
                    
                    TranscriptionResultResponse transcriptionResult = new TranscriptionResultResponse();
                    transcriptionResult.setTranscriptionText(extractTranscriptionText(resultMap));
                    transcriptionResult.setLanguage(String.valueOf(resultMap.getOrDefault("language", "unknown")));
                    transcriptionResult.setConfidence(extractDoubleSafely(resultMap.get("confidence_score")));
                    transcriptionResult.setDuration(extractDoubleSafely(resultMap.get("duration")));
                    transcriptionResult.setModelUsed(String.valueOf(resultMap.getOrDefault("model_used", "unknown")));
                    transcriptionResult.setProcessingTime(extractDoubleSafely(resultMap.get("processing_time")));
                    transcriptionResult.setCompletedAt(LocalDateTime.now());
                    transcriptionResult.setStatus(TranscriptionStatus.COMPLETED);
                    
                    progressResponse.setResult(transcriptionResult);
                }
                
                // Handle error if present
                Object errorObj = result.get("error");
                if (errorObj != null) {
                    progressResponse.setError(String.valueOf(errorObj));
                }
                
                // Map timestamps
                Object createdAtObj = result.get("created_at");
                if (createdAtObj != null) {
                    try {
                        String createdAtStr = String.valueOf(createdAtObj);
                        // Handle ISO format with optional timezone
                        if (createdAtStr.contains("T")) {
                            createdAtStr = createdAtStr.split("\\+")[0].split("Z")[0];
                        }
                        progressResponse.setCreatedAt(LocalDateTime.parse(createdAtStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                    } catch (Exception e) {
                        logger.warn("Failed to parse created_at: {}", createdAtObj);
                    }
                }
                
                Object updatedAtObj = result.get("updated_at");
                if (updatedAtObj != null) {
                    try {
                        String updatedAtStr = String.valueOf(updatedAtObj);
                        // Handle ISO format with optional timezone
                        if (updatedAtStr.contains("T")) {
                            updatedAtStr = updatedAtStr.split("\\+")[0].split("Z")[0];
                        }
                        progressResponse.setUpdatedAt(LocalDateTime.parse(updatedAtStr, DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                    } catch (Exception e) {
                        logger.warn("Failed to parse updated_at: {}", updatedAtObj);
                    }
                }
                
                return progressResponse;
            } else {
                throw new TranscriptionProcessingException("Python service returned unexpected response: " + 
                    (response.getStatusCode() != null ? response.getStatusCode() : "null status"));
            }
            
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new TranscriptionProcessingException("Job not found: " + jobId);
            }
            String responseBody = e.getResponseBodyAsString();
            logger.error("Python service error ({}): {}. Response: {}", 
                e.getStatusCode(), e.getMessage(), responseBody, e);
            throw new TranscriptionProcessingException("Transcription service error: " + e.getStatusCode(), e);
        } catch (ResourceAccessException e) {
            logger.error("Failed to connect to Python service: {}", e.getMessage(), e);
            throw new TranscriptionProcessingException("Transcription service is unavailable", e);
        } catch (Exception e) {
            logger.error("Failed to get job progress: {}", e.getMessage(), e);
            throw new TranscriptionProcessingException("Failed to get job progress: " + e.getMessage(), e);
        }
    }
}
