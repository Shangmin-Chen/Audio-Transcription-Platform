/**
 * Comprehensive unit tests for TranscriptionService covering all failure scenarios.
 * 
 * These tests verify that the service properly handles:
 * - Network failures
 * - Invalid responses
 * - Error responses
 * - Timeout scenarios
 * - Malformed data
 */

import TranscriptionService from '../transcription';
import apiClient from '../api';
import {
  TranscriptionResultResponse,
  JobSubmissionResponse,
  JobProgressResponse
} from '../../types/transcription';

// Mock the API client
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('TranscriptionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========== Direct Transcription Tests ==========

  describe('transcribeAudio', () => {
    const mockFile = new File(['test audio content'], 'test.mp3', { type: 'audio/mpeg' });

    it('should successfully transcribe audio with valid response', async () => {
      const mockResponse: TranscriptionResultResponse = {
        transcriptionText: 'Hello world',
        language: 'en',
        confidence: 0.95,
        duration: 5.5,
        modelUsed: 'base',
        processingTime: 2.3,
        completedAt: new Date().toISOString(),
        status: 'COMPLETED' as any,
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await TranscriptionService.transcribeAudio(mockFile, 'base');

      expect(result).toEqual(mockResponse);
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/audio/transcribe',
        expect.any(FormData),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'multipart/form-data',
          }),
          params: { modelSize: 'base' },
        })
      );
    });

    it('should handle network errors', async () => {
      mockedApiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(
        TranscriptionService.transcribeAudio(mockFile)
      ).rejects.toThrow('Network error');
    });

    it('should handle 400 Bad Request errors', async () => {
      const error: any = new Error('Bad Request');
      error.response = { status: 400, data: { message: 'Invalid file format' } };
      mockedApiClient.post.mockRejectedValue(error);

      await expect(
        TranscriptionService.transcribeAudio(mockFile)
      ).rejects.toThrow();
    });

    it('should handle 413 Payload Too Large errors', async () => {
      const error: any = new Error('Payload Too Large');
      error.response = { status: 413, data: { message: 'File too large' } };
      mockedApiClient.post.mockRejectedValue(error);

      await expect(
        TranscriptionService.transcribeAudio(mockFile)
      ).rejects.toThrow();
    });

    it('should handle 500 Internal Server Error', async () => {
      const error: any = new Error('Internal Server Error');
      error.response = { status: 500, data: { message: 'Server error' } };
      mockedApiClient.post.mockRejectedValue(error);

      await expect(
        TranscriptionService.transcribeAudio(mockFile)
      ).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      const error: any = new Error('Timeout');
      error.code = 'ECONNABORTED';
      mockedApiClient.post.mockRejectedValue(error);

      await expect(
        TranscriptionService.transcribeAudio(mockFile)
      ).rejects.toThrow('Timeout');
    });

    it('should handle malformed response data', async () => {
      mockedApiClient.post.mockResolvedValue({ data: null });

      await expect(
        TranscriptionService.transcribeAudio(mockFile)
      ).rejects.toThrow();
    });

    it('should handle response missing required fields', async () => {
      const invalidResponse = {
        language: 'en',
        // Missing transcriptionText
      };
      mockedApiClient.post.mockResolvedValue({ data: invalidResponse });

      await expect(
        TranscriptionService.transcribeAudio(mockFile)
      ).rejects.toThrow();
    });

    it('should include modelSize in request when provided', async () => {
      mockedApiClient.post.mockResolvedValue({ data: {} as TranscriptionResultResponse });

      await TranscriptionService.transcribeAudio(mockFile, 'large');

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(FormData),
        expect.objectContaining({
          params: { modelSize: 'large' },
        })
      );
    });

    it('should not include modelSize when not provided', async () => {
      mockedApiClient.post.mockResolvedValue({ data: {} as TranscriptionResultResponse });

      await TranscriptionService.transcribeAudio(mockFile);

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(FormData),
        expect.objectContaining({
          params: {},
        })
      );
    });
  });

  // ========== Job Submission Tests ==========

  describe('submitTranscriptionJob', () => {
    const mockFile = new File(['test audio content'], 'test.mp3', { type: 'audio/mpeg' });

    it('should successfully submit job with valid response', async () => {
      const mockResponse: JobSubmissionResponse = {
        jobId: 'test-job-id',
        status: 'PENDING',
        message: 'Job submitted successfully',
      };

      mockedApiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await TranscriptionService.submitTranscriptionJob(
        mockFile,
        'base',
        'en',
        'transcribe'
      );

      expect(result).toEqual(mockResponse);
      expect(result.jobId).toBe('test-job-id');
    });

    it('should handle network errors during job submission', async () => {
      mockedApiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(
        TranscriptionService.submitTranscriptionJob(mockFile)
      ).rejects.toThrow('Network error');
    });

    it('should handle 400 Bad Request errors', async () => {
      const error: any = new Error('Bad Request');
      error.response = { status: 400, data: { message: 'Invalid file' } };
      mockedApiClient.post.mockRejectedValue(error);

      await expect(
        TranscriptionService.submitTranscriptionJob(mockFile)
      ).rejects.toThrow();
    });

    it('should handle 413 Payload Too Large errors', async () => {
      const error: any = new Error('Payload Too Large');
      error.response = { status: 413 };
      mockedApiClient.post.mockRejectedValue(error);

      await expect(
        TranscriptionService.submitTranscriptionJob(mockFile)
      ).rejects.toThrow();
    });

    it('should include optional parameters when provided', async () => {
      mockedApiClient.post.mockResolvedValue({ data: {} as JobSubmissionResponse });

      await TranscriptionService.submitTranscriptionJob(
        mockFile,
        'large',
        'es',
        'translate'
      );

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(FormData),
        expect.objectContaining({
          params: {
            modelSize: 'large',
            language: 'es',
            task: 'translate',
          },
        })
      );
    });

    it('should not include language when set to "auto"', async () => {
      mockedApiClient.post.mockResolvedValue({ data: {} as JobSubmissionResponse });

      await TranscriptionService.submitTranscriptionJob(mockFile, undefined, 'auto');

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(FormData),
        expect.objectContaining({
          params: expect.not.objectContaining({
            language: expect.anything(),
          }),
        })
      );
    });

    it('should handle malformed job submission response', async () => {
      mockedApiClient.post.mockResolvedValue({ data: null });

      await expect(
        TranscriptionService.submitTranscriptionJob(mockFile)
      ).rejects.toThrow();
    });
  });

  // ========== Job Progress Tests ==========

  describe('getJobProgress', () => {
    it('should successfully get job progress', async () => {
      const mockResponse: JobProgressResponse = {
        jobId: 'test-job-id',
        status: 'PROCESSING',
        progress: 50.0,
        message: 'Processing...',
        result: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockedApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await TranscriptionService.getJobProgress('test-job-id');

      expect(result).toEqual(mockResponse);
      expect(mockedApiClient.get).toHaveBeenCalledWith('/audio/jobs/test-job-id/progress');
    });

    it('should handle 404 Not Found errors', async () => {
      const error: any = new Error('Not Found');
      error.response = { status: 404, data: { message: 'Job not found' } };
      mockedApiClient.get.mockRejectedValue(error);

      await expect(
        TranscriptionService.getJobProgress('nonexistent-job-id')
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      mockedApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(
        TranscriptionService.getJobProgress('test-job-id')
      ).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      const error: any = new Error('Timeout');
      error.code = 'ECONNABORTED';
      mockedApiClient.get.mockRejectedValue(error);

      await expect(
        TranscriptionService.getJobProgress('test-job-id')
      ).rejects.toThrow('Timeout');
    });

    it('should handle malformed progress response', async () => {
      mockedApiClient.get.mockResolvedValue({ data: null });

      await expect(
        TranscriptionService.getJobProgress('test-job-id')
      ).rejects.toThrow();
    });

    it('should handle response with completed job and result', async () => {
      const mockResponse: JobProgressResponse = {
        jobId: 'test-job-id',
        status: 'COMPLETED',
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
          status: 'COMPLETED' as any,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockedApiClient.get.mockResolvedValue({ data: mockResponse });

      const result = await TranscriptionService.getJobProgress('test-job-id');

      expect(result.status).toBe('COMPLETED');
      expect(result.result).not.toBeNull();
      expect(result.result?.transcriptionText).toBe('Transcribed text');
    });
  });

  // ========== Health Check Tests ==========

  describe('healthCheck', () => {
    it('should successfully perform health check', async () => {
      mockedApiClient.get.mockResolvedValue({ data: { status: 'ok' } });

      const result = await TranscriptionService.healthCheck();

      expect(result.status).toBe('ok');
      expect(mockedApiClient.get).toHaveBeenCalledWith('/audio/health');
    });

    it('should handle health check failures', async () => {
      mockedApiClient.get.mockRejectedValue(new Error('Service unavailable'));

      await expect(
        TranscriptionService.healthCheck()
      ).rejects.toThrow('Service unavailable');
    });
  });
});






