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

import { TRANSCRIPTION_CONFIG } from '../utils/constants';

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
  const pollAttemptsRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    pollAttemptsRef.current = 0;
  }, []);

  const pollJobProgress = useCallback(async (jobId: string) => {
    try {
      const progressResponse: JobProgressResponse = await TranscriptionService.getJobProgress(jobId);
      
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
        // Continue polling
        pollAttemptsRef.current += 1;
        if (pollAttemptsRef.current >= TRANSCRIPTION_CONFIG.MAX_POLL_ATTEMPTS) {
          stopPolling();
          setError('Transcription timed out. Please try again.');
          setIsTranscribing(false);
        }
      }
    } catch (err: any) {
      stopPolling();
      setError(err.response?.data?.message || err.message || 'Failed to check job progress');
      setIsTranscribing(false);
    }
  }, [stopPolling]);

  const jobSubmissionMutation = useMutation({
    mutationFn: ({ file, modelSize }: { file: File; modelSize?: WhisperModelSize }) => 
      TranscriptionService.submitTranscriptionJob(file, modelSize),
    onSuccess: (data: JobSubmissionResponse) => {
      setProgress(0);
      setStatusMessage(data.message || 'Job submitted, starting transcription...');
      
      // Set up polling interval
      const poll = () => {
        if (data.jobId) {
          pollJobProgress(data.jobId);
        }
      };
      
      // Start polling immediately, then continue at interval
      poll();
      pollIntervalRef.current = setInterval(poll, TRANSCRIPTION_CONFIG.POLL_INTERVAL_MS);
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
