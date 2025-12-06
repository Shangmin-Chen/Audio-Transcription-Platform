package com.shangmin.whisperrr.dto;

import java.time.LocalDateTime;
import java.util.List;

public class TranscriptionResultResponse {
    private String transcriptionText;
    private String language;
    private Double confidence;
    private Double duration;
    private String modelUsed;
    private Double processingTime;
    private LocalDateTime completedAt;
    private TranscriptionStatus status;
    private List<TranscriptionSegment> segments;
    
    public TranscriptionResultResponse() {}
    
    public TranscriptionResultResponse(String transcriptionText, String language, Double confidence, 
                                     LocalDateTime completedAt, TranscriptionStatus status) {
        this.transcriptionText = transcriptionText;
        this.language = language;
        this.confidence = confidence;
        this.completedAt = completedAt;
        this.status = status;
    }
    
    public String getTranscriptionText() {
        return transcriptionText;
    }
    
    public void setTranscriptionText(String transcriptionText) {
        this.transcriptionText = transcriptionText;
    }
    
    public String getLanguage() {
        return language;
    }
    
    public void setLanguage(String language) {
        this.language = language;
    }
    
    public Double getConfidence() {
        return confidence;
    }
    
    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }
    
    public Double getDuration() {
        return duration;
    }
    
    public void setDuration(Double duration) {
        this.duration = duration;
    }
    
    public String getModelUsed() {
        return modelUsed;
    }
    
    public void setModelUsed(String modelUsed) {
        this.modelUsed = modelUsed;
    }
    
    public Double getProcessingTime() {
        return processingTime;
    }
    
    public void setProcessingTime(Double processingTime) {
        this.processingTime = processingTime;
    }
    
    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
    
    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
    
    public TranscriptionStatus getStatus() {
        return status;
    }
    
    public void setStatus(TranscriptionStatus status) {
        this.status = status;
    }
    
    public List<TranscriptionSegment> getSegments() {
        return segments;
    }
    
    public void setSegments(List<TranscriptionSegment> segments) {
        this.segments = segments;
    }
}
