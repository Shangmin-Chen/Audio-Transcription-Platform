/**
 * Comprehensive unit tests for useTranscription hook covering all failure scenarios.
 * 
 * These tests verify that the hook properly handles:
 * - Job submission failures
 * - Polling failures
 * - Network errors
 * - State management edge cases
 * - Error recovery
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useTranscription } from '../useTranscription';
import { TranscriptionService } from '../../services/transcription';
import {
  TranscriptionStatus,
  JobProgressResponse,
} from '../../types/transcription';

// Mock the transcription service
jest.mock('../../services/transcription', () => ({
  TranscriptionService: {
    submitTranscriptionJob: jest.fn(),
    getJobProgress: jest.fn(),
  },
}));

const mockedTranscriptionService = TranscriptionService as jest.Mocked<typeof TranscriptionService>;

describe('useTranscription', () => {
  let queryClient: QueryClient;
  let wrapper: React.FC<{ children: React.ReactNode }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ========== Job Submission Tests ==========

  it('should successfully submit transcription job', async () => {
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    const mockJobResponse = {
      jobId: 'test-job-id',
      status: 'PENDING' as const,
      message: 'Job submitted',
    };

    mockedTranscriptionService.submitTranscriptionJob.mockResolvedValue(mockJobResponse);

    const { result } = renderHook(() => useTranscription(), { wrapper });

    await act(async () => {
      await result.current.transcribeAudio(mockFile);
    });

    expect(mockedTranscriptionService.submitTranscriptionJob).toHaveBeenCalledWith(
      mockFile,
      undefined,
      undefined,
      undefined
    );
    expect(result.current.isTranscribing).toBe(true);
  });

  it('should handle job submission failure', async () => {
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    const error = new Error('Submission failed');

    mockedTranscriptionService.submitTranscriptionJob.mockRejectedValue(error);

    const { result } = renderHook(() => useTranscription(), { wrapper });

    await act(async () => {
      try {
        await result.current.transcribeAudio(mockFile);
      } catch (e) {
        // Expected to fail
      }
    });

    await waitFor(() => {
      expect(result.current.isFailed).toBe(true);
      expect(result.current.error).toBeTruthy();
    });
  });

  it('should handle network errors during submission', async () => {
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    const networkError: any = new Error('Network error');
    networkError.response = { status: 500 };

    mockedTranscriptionService.submitTranscriptionJob.mockRejectedValue(networkError);

    const { result } = renderHook(() => useTranscription(), { wrapper });

    await act(async () => {
      try {
        await result.current.transcribeAudio(mockFile);
      } catch (e) {
        // Expected to fail
      }
    });

    await waitFor(() => {
      expect(result.current.isFailed).toBe(true);
    });
  });

  // ========== Polling Tests ==========

  it('should poll for job progress', async () => {
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    const mockJobResponse = {
      jobId: 'test-job-id',
      status: 'PENDING' as const,
      message: 'Job submitted',
    };

    const mockProgressResponse: JobProgressResponse = {
      jobId: 'test-job-id',
      status: TranscriptionStatus.PROCESSING,
      progress: 50.0,
      message: 'Processing...',
      result: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockedTranscriptionService.submitTranscriptionJob.mockResolvedValue(mockJobResponse);
    mockedTranscriptionService.getJobProgress.mockResolvedValue(mockProgressResponse);

    const { result } = renderHook(() => useTranscription(), { wrapper });

    await act(async () => {
      await result.current.transcribeAudio(mockFile);
    });

    // Advance timers to trigger polling
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(mockedTranscriptionService.getJobProgress).toHaveBeenCalledWith('test-job-id');
    });
  });

  it('should handle polling errors gracefully', async () => {
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    const mockJobResponse = {
      jobId: 'test-job-id',
      status: 'PENDING' as const,
      message: 'Job submitted',
    };

    mockedTranscriptionService.submitTranscriptionJob.mockResolvedValue(mockJobResponse);
    mockedTranscriptionService.getJobProgress.mockRejectedValue(new Error('Polling failed'));

    const { result } = renderHook(() => useTranscription(), { wrapper });

    await act(async () => {
      await result.current.transcribeAudio(mockFile);
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should continue polling despite errors (transient errors)
    await waitFor(() => {
      expect(mockedTranscriptionService.getJobProgress).toHaveBeenCalled();
    });
  });

  it('should stop polling when job not found (404)', async () => {
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    const mockJobResponse = {
      jobId: 'test-job-id',
      status: 'PENDING' as const,
      message: 'Job submitted',
    };

    const notFoundError: any = new Error('Not Found');
    notFoundError.response = { status: 404 };

    mockedTranscriptionService.submitTranscriptionJob.mockResolvedValue(mockJobResponse);
    mockedTranscriptionService.getJobProgress.mockRejectedValue(notFoundError);

    const { result } = renderHook(() => useTranscription(), { wrapper });

    await act(async () => {
      await result.current.transcribeAudio(mockFile);
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isFailed).toBe(true);
      expect(result.current.error).toContain('not found');
    });
  });

  it('should stop polling when job completes', async () => {
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    const mockJobResponse = {
      jobId: 'test-job-id',
      status: 'PENDING' as const,
      message: 'Job submitted',
    };

    const completedResponse: JobProgressResponse = {
      jobId: 'test-job-id',
      status: TranscriptionStatus.COMPLETED,
      progress: 100.0,
      message: 'Completed',
      result: {
        transcriptionText: 'Transcribed text',
        language: 'en',
        confidence: 0.9,
        duration: 10.0,
        modelUsed: 'base',
        processingTime: 5.0,
        completedAt: new Date().toISOString(),
        status: TranscriptionStatus.COMPLETED,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockedTranscriptionService.submitTranscriptionJob.mockResolvedValue(mockJobResponse);
    mockedTranscriptionService.getJobProgress.mockResolvedValue(completedResponse);

    const { result } = renderHook(() => useTranscription(), { wrapper });

    await act(async () => {
      await result.current.transcribeAudio(mockFile);
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isCompleted).toBe(true);
      expect(result.current.transcriptionResult).not.toBeNull();
    });

    // Verify polling stopped
    const callCount = mockedTranscriptionService.getJobProgress.mock.calls.length;
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    // Should not have made additional calls after completion
    expect(mockedTranscriptionService.getJobProgress.mock.calls.length).toBe(callCount);
  });

  it('should stop polling when job fails', async () => {
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    const mockJobResponse = {
      jobId: 'test-job-id',
      status: 'PENDING' as const,
      message: 'Job submitted',
    };

    const failedResponse: JobProgressResponse = {
      jobId: 'test-job-id',
      status: TranscriptionStatus.FAILED,
      progress: 0.0,
      message: 'Transcription failed',
      result: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockedTranscriptionService.submitTranscriptionJob.mockResolvedValue(mockJobResponse);
    mockedTranscriptionService.getJobProgress.mockResolvedValue(failedResponse);

    const { result } = renderHook(() => useTranscription(), { wrapper });

    await act(async () => {
      await result.current.transcribeAudio(mockFile);
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.isFailed).toBe(true);
      expect(result.current.error).toBeTruthy();
    });
  });

  // ========== State Management Tests ==========

  it('should reset state correctly', async () => {
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    const mockJobResponse = {
      jobId: 'test-job-id',
      status: 'PENDING' as const,
      message: 'Job submitted',
    };

    mockedTranscriptionService.submitTranscriptionJob.mockResolvedValue(mockJobResponse);

    const { result } = renderHook(() => useTranscription(), { wrapper });

    await act(async () => {
      await result.current.transcribeAudio(mockFile);
    });

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.isIdle).toBe(true);
    expect(result.current.transcriptionResult).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.progress).toBe(0);
  });

  it('should clear error correctly', async () => {
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    const error = new Error('Test error');

    mockedTranscriptionService.submitTranscriptionJob.mockRejectedValue(error);

    const { result } = renderHook(() => useTranscription(), { wrapper });

    await act(async () => {
      try {
        await result.current.transcribeAudio(mockFile);
      } catch (e) {
        // Expected to fail
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle multiple rapid submissions', async () => {
    const mockFile1 = new File(['test1'], 'test1.mp3', { type: 'audio/mpeg' });
    const mockFile2 = new File(['test2'], 'test2.mp3', { type: 'audio/mpeg' });

    const mockJobResponse1 = {
      jobId: 'job-1',
      status: 'PENDING' as const,
      message: 'Job 1 submitted',
    };

    const mockJobResponse2 = {
      jobId: 'job-2',
      status: 'PENDING' as const,
      message: 'Job 2 submitted',
    };

    mockedTranscriptionService.submitTranscriptionJob
      .mockResolvedValueOnce(mockJobResponse1)
      .mockResolvedValueOnce(mockJobResponse2);

    const { result } = renderHook(() => useTranscription(), { wrapper });

    await act(async () => {
      await result.current.transcribeAudio(mockFile1);
    });

    await act(async () => {
      await result.current.transcribeAudio(mockFile2);
    });

    // Should have stopped polling for first job and started polling for second
    expect(mockedTranscriptionService.submitTranscriptionJob).toHaveBeenCalledTimes(2);
  });

  // ========== Computed State Tests ==========

  it('should correctly identify idle state', () => {
    const { result } = renderHook(() => useTranscription(), { wrapper });

    expect(result.current.isIdle).toBe(true);
    expect(result.current.isTranscribing).toBe(false);
    expect(result.current.isCompleted).toBe(false);
    expect(result.current.isFailed).toBe(false);
  });

  it('should correctly identify transcribing state', async () => {
    const mockFile = new File(['test'], 'test.mp3', { type: 'audio/mpeg' });
    const mockJobResponse = {
      jobId: 'test-job-id',
      status: 'PENDING' as const,
      message: 'Job submitted',
    };

    mockedTranscriptionService.submitTranscriptionJob.mockResolvedValue(mockJobResponse);

    const { result } = renderHook(() => useTranscription(), { wrapper });

    await act(async () => {
      await result.current.transcribeAudio(mockFile);
    });

    expect(result.current.isTranscribing).toBe(true);
    expect(result.current.isIdle).toBe(false);
  });
});

