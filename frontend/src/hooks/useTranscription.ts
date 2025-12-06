/**
 * Custom hook for managing audio transcription workflow.
 * 
 * This hook handles the complete transcription process including:
 * - Job submission for asynchronous processing
 * - Progress polling with automatic retry logic
 * - State management for transcription results, errors, and progress
 * - Cleanup and reset functionality
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { TranscriptionService } from '../services/transcription';
import { 
  TranscriptionResultResponse,
  TranscriptionStatus,
  WhisperModelSize,
  JobSubmissionResponse,
  JobProgressResponse
} from '../types/transcription';
import { TRANSCRIPTION_CONFIG } from '../utils/constants';

export interface UseTranscriptionReturn {
  transcriptionResult: TranscriptionResultResponse | null;
  error: string | null;
  progress: number;
  statusMessage: string | null;
  transcribeAudio: (file: File, modelSize?: WhisperModelSize) => Promise<void>;
  clearError: () => void;
  reset: () => void;
  isTranscribing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  isIdle: boolean;
}

/**
 * Hook for managing transcription workflow with polling support.
 * 
 * @returns transcription state and control functions
 */
export const useTranscription = (): UseTranscriptionReturn => {
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveErrorsRef = useRef<number>(0);
  const currentPollIntervalRef = useRef<number>(TRANSCRIPTION_CONFIG.INITIAL_POLL_INTERVAL_MS);
  const jobStartTimeRef = useRef<number | null>(null);
  const lastProgressUpdateTimeRef = useRef<number | null>(null);
  const lastProgressValueRef = useRef<number>(0);
  const MAX_CONSECUTIVE_ERRORS = 5; // Allow up to 5 consecutive errors before giving up

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearTimeout(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    consecutiveErrorsRef.current = 0;
    currentPollIntervalRef.current = TRANSCRIPTION_CONFIG.INITIAL_POLL_INTERVAL_MS;
    jobStartTimeRef.current = null;
    lastProgressUpdateTimeRef.current = null;
    lastProgressValueRef.current = 0;
  }, []);

  const pollJobProgress = useCallback(async (jobId: string) => {
    const now = Date.now();
    
    // Check if job has been running too long
    if (jobStartTimeRef.current !== null) {
      const elapsed = now - jobStartTimeRef.current;
      if (elapsed > TRANSCRIPTION_CONFIG.MAX_JOB_DURATION_MS) {
        stopPolling();
        setError(`Transcription timed out after ${Math.round(elapsed / 60000)} minutes. The job may still be processing on the server.`);
        setIsTranscribing(false);
        return;
      }
    }
    
    // Check if job appears to be hung (no progress update for too long)
    if (lastProgressUpdateTimeRef.current !== null) {
      const timeSinceLastUpdate = now - lastProgressUpdateTimeRef.current;
      if (timeSinceLastUpdate > TRANSCRIPTION_CONFIG.MAX_STALL_TIME_MS) {
        stopPolling();
        setError(`Job appears to be stuck (no progress update for ${Math.round(timeSinceLastUpdate / 60000)} minutes). Please try again.`);
        setIsTranscribing(false);
        return;
      }
    }
    
    try {
      const progressResponse: JobProgressResponse = await TranscriptionService.getJobProgress(jobId);
      
      // Reset consecutive errors on successful response
      consecutiveErrorsRef.current = 0;
      setError(null); // Clear any previous error messages
      
      // Check if progress actually changed
      const progressChanged = progressResponse.progress !== lastProgressValueRef.current;
      if (progressChanged) {
        lastProgressUpdateTimeRef.current = now;
        lastProgressValueRef.current = progressResponse.progress;
        
        // Reset polling interval on progress (job is active)
        currentPollIntervalRef.current = TRANSCRIPTION_CONFIG.INITIAL_POLL_INTERVAL_MS;
      } else {
        // No progress change - increase polling interval (adaptive backoff)
        currentPollIntervalRef.current = Math.min(
          currentPollIntervalRef.current + TRANSCRIPTION_CONFIG.POLL_INTERVAL_BACKOFF_MS,
          TRANSCRIPTION_CONFIG.MAX_POLL_INTERVAL_MS
        );
      }
      
      setProgress(progressResponse.progress);
      setStatusMessage(progressResponse.message);
      
      if (progressResponse.status === 'COMPLETED' && progressResponse.result) {
        stopPolling();
        setTranscriptionResult(progressResponse.result);
        setProgress(100);
        setStatusMessage('Transcription completed');
        setIsTranscribing(false);
        setError(null);
      } else if (progressResponse.status === 'FAILED') {
        stopPolling();
        setError(progressResponse.error || progressResponse.message || 'Transcription failed');
        setProgress(0);
        setIsTranscribing(false);
      } else {
        // Continue polling with adaptive interval
        // Schedule next poll with current interval
        if (pollIntervalRef.current) {
          clearTimeout(pollIntervalRef.current);
        }
        pollIntervalRef.current = setTimeout(() => {
          pollJobProgress(jobId);
        }, currentPollIntervalRef.current);
      }
    } catch (err: any) {
      consecutiveErrorsRef.current += 1;
      
      // Only stop polling after multiple consecutive errors
      if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
        stopPolling();
        const errorMessage = err.response?.data?.message || err.message || 'Failed to check job progress';
        setError(errorMessage);
        setIsTranscribing(false);
      } else {
        // Log the error but continue polling - might be a transient network issue
        console.warn(`Polling error (${consecutiveErrorsRef.current}/${MAX_CONSECUTIVE_ERRORS}):`, err.message);
        // Update status message to indicate retrying
        setStatusMessage(`Checking progress... (retrying after error)`);
        
        // Continue polling with current interval even after error
        if (pollIntervalRef.current) {
          clearTimeout(pollIntervalRef.current);
        }
        pollIntervalRef.current = setTimeout(() => {
          pollJobProgress(jobId);
        }, currentPollIntervalRef.current);
      }
    }
  }, [stopPolling]);

  const jobSubmissionMutation = useMutation({
    mutationFn: ({ file, modelSize }: { file: File; modelSize?: WhisperModelSize }) => 
      TranscriptionService.submitTranscriptionJob(file, modelSize),
    onSuccess: (data: JobSubmissionResponse) => {
      setProgress(0);
      setStatusMessage(data.message || 'Job submitted, starting transcription...');
      
      // Initialize tracking for new job
      jobStartTimeRef.current = Date.now();
      lastProgressUpdateTimeRef.current = Date.now();
      lastProgressValueRef.current = 0;
      currentPollIntervalRef.current = TRANSCRIPTION_CONFIG.INITIAL_POLL_INTERVAL_MS;
      
      // Start polling immediately
      if (data.jobId) {
        pollJobProgress(data.jobId);
      }
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || error.message || 'Failed to submit transcription job');
      setProgress(0);
      setStatusMessage(null);
      setIsTranscribing(false);
    },
  });

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const transcribeAudio = useCallback(async (file: File, modelSize?: WhisperModelSize) => {
    setError(null);
    setTranscriptionResult(null);
    setProgress(0);
    setStatusMessage('Submitting job...');
    setIsTranscribing(true);
    stopPolling(); // Stop any existing polling
    await jobSubmissionMutation.mutateAsync({ file, modelSize });
  }, [jobSubmissionMutation, stopPolling]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setTranscriptionResult(null);
    setError(null);
    setProgress(0);
    setStatusMessage(null);
    setIsTranscribing(false);
    jobSubmissionMutation.reset();
  }, [jobSubmissionMutation, stopPolling]);

  const isCompleted = transcriptionResult?.status === TranscriptionStatus.COMPLETED;
  const isFailed = jobSubmissionMutation.isError || (error !== null && !isTranscribing);
  const isIdle = !isTranscribing && !isCompleted && !isFailed;

  return {
    transcriptionResult,
    error: error || jobSubmissionMutation.error?.message,
    progress,
    statusMessage,
    transcribeAudio,
    clearError,
    reset,
    isTranscribing,
    isCompleted,
    isFailed,
    isIdle,
  };
};
