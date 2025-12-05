package com.shangmin.whisperrr.dto;

import java.time.LocalDateTime;

/**
 * Response DTO for job progress.
 */
public class JobProgressResponse {
    private String jobId;
    private String status;
    private Double progress;
    private String message;
    private TranscriptionResultResponse result;
    private String error;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public JobProgressResponse() {}
    
    public String getJobId() {
        return jobId;
    }
    
    public void setJobId(String jobId) {
        this.jobId = jobId;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public Double getProgress() {
        return progress;
    }
    
    public void setProgress(Double progress) {
        this.progress = progress;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public TranscriptionResultResponse getResult() {
        return result;
    }
    
    public void setResult(TranscriptionResultResponse result) {
        this.result = result;
    }
    
    public String getError() {
        return error;
    }
    
    public void setError(String error) {
        this.error = error;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

