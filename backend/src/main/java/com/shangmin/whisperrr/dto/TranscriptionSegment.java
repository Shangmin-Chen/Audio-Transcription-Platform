package com.shangmin.whisperrr.dto;

/**
 * Data Transfer Object for a transcription segment with timing information.
 * 
 * <p>Represents a single segment of transcribed text with its start and end times,
 * text content, and optional confidence score. Segments are used to provide
 * time-aligned transcription results.</p>
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */
public class TranscriptionSegment {
    
    /** Start time of the segment in seconds. */
    private double startTime;
    
    /** End time of the segment in seconds. */
    private double endTime;
    
    /** Transcribed text for this segment. */
    private String text;
    
    /** Confidence score for this segment (0.0 to 1.0), optional. */
    private Double confidence;
    
    public TranscriptionSegment() {}
    
    public TranscriptionSegment(double startTime, double endTime, String text) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.text = text;
    }
    
    public TranscriptionSegment(double startTime, double endTime, String text, Double confidence) {
        this.startTime = startTime;
        this.endTime = endTime;
        this.text = text;
        this.confidence = confidence;
    }
    
    public double getStartTime() {
        return startTime;
    }
    
    public void setStartTime(double startTime) {
        this.startTime = startTime;
    }
    
    public double getEndTime() {
        return endTime;
    }
    
    public void setEndTime(double endTime) {
        this.endTime = endTime;
    }
    
    public String getText() {
        return text;
    }
    
    public void setText(String text) {
        this.text = text;
    }
    
    public Double getConfidence() {
        return confidence;
    }
    
    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }
}
