/**
 * Transcription service for API communication.
 * 
 * This service handles all API calls related to audio transcription, including
 * direct transcription, asynchronous job submission, and job progress tracking.
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */

import apiClient from './api';
import { TranscriptionResultResponse, JobSubmissionResponse, JobProgressResponse } from '../types/transcription';

/**
 * Service class for transcription API operations.
 */
export class TranscriptionService {
  static async transcribeAudio(file: File, modelSize?: string): Promise<TranscriptionResultResponse> {
    const formData = new FormData();
    formData.append('audioFile', file);

    const params: Record<string, string> = {};
    if (modelSize) {
      params.modelSize = modelSize;
    }

    const response = await apiClient.post<TranscriptionResultResponse>('/audio/transcribe', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params,
    });

    return response.data;
  }

  static async submitTranscriptionJob(file: File, modelSize?: string): Promise<JobSubmissionResponse> {
    const formData = new FormData();
    formData.append('audioFile', file);

    const params: Record<string, string> = {};
    if (modelSize) {
      params.modelSize = modelSize;
    }

    const response = await apiClient.post<JobSubmissionResponse>('/audio/jobs/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params,
    });

    return response.data;
  }

  static async getJobProgress(jobId: string): Promise<JobProgressResponse> {
    const response = await apiClient.get<JobProgressResponse>(`/audio/jobs/${jobId}/progress`);
    return response.data;
  }
}

export default TranscriptionService;