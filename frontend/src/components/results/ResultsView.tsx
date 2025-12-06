/**
 * Results View Component for displaying transcription results.
 * 
 * This component displays the complete transcription results including:
 * - Full transcription text with copy/download functionality
 * - Metadata (duration, language, confidence, processing time)
 * - Model information
 * - Formatted display with dark mode support
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */

import React, { useState } from 'react';
import { 
  Copy, 
  Download, 
  Volume2, 
  Clock,
  FileText,
  CheckCircle,
  List,
  AlignLeft
} from 'lucide-react';
import { clsx } from 'clsx';
import { 
  TranscriptionResultResponse
} from '../../types/transcription';
import { 
  formatDuration, 
  formatTimestamp, 
  formatConfidence,
  formatProcessingTime,
  formatSegmentTimestamp
} from '../../utils/formatters';
import { UI_CONFIG } from '../../utils/constants';
import { Button } from '../common/Button';

interface ResultsViewProps {
  result: TranscriptionResultResponse;
  className?: string;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  result,
  className,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'full' | 'segments'>('full');

  if (!result.transcriptionText) {
    return (
      <div className={clsx('card p-6 text-center', className)}>
        <p className="text-gray-500 dark:text-gray-400">
          No transcription result available
        </p>
      </div>
    );
  }

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(result.transcriptionText);
      setCopied(true);
      setTimeout(() => setCopied(false), UI_CONFIG.COPY_FEEDBACK_TIMEOUT_MS);
    } catch (error) {
      // Clipboard API may fail in some browsers/environments
      // Fail silently as this is a non-critical operation
    }
  };

  const handleDownloadText = () => {
    const blob = new Blob([result.transcriptionText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const data = {
      ...result,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Transcription Complete
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Your audio has been successfully transcribed
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              leftIcon={copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadText}
              leftIcon={<Download className="h-4 w-4" />}
            >
              Download TXT
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadJSON}
              leftIcon={<FileText className="h-4 w-4" />}
            >
              Download JSON
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {result.duration !== undefined && result.duration !== null && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDuration(result.duration)}
                </p>
              </div>
            </div>
          )}
          
          {result.language && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Volume2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Language</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {result.language}
                </p>
              </div>
            </div>
          )}
          
          {result.processingTime !== undefined && result.processingTime !== null && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Processing Time</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatProcessingTime(result.processingTime * 1000)}
                </p>
              </div>
            </div>
          )}
          
          {result.confidence !== undefined && result.confidence !== null && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Confidence</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatConfidence(result.confidence)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Transcription Text / Segments */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transcription
          </h3>
          <div className="flex items-center gap-3">
            {result.confidence !== undefined && result.confidence !== null && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Confidence:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatConfidence(result.confidence)}
                </span>
              </div>
            )}
            {result.segments && result.segments.length > 0 && (
              <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('full')}
                  className={clsx(
                    'px-3 py-1.5 text-sm font-medium transition-colors',
                    viewMode === 'full'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <AlignLeft className="h-4 w-4" />
                    Full Text
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('segments')}
                  className={clsx(
                    'px-3 py-1.5 text-sm font-medium transition-colors',
                    viewMode === 'segments'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <List className="h-4 w-4" />
                    Segments
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
        
        {viewMode === 'full' ? (
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap text-base">
              {result.transcriptionText}
            </p>
          </div>
        ) : result.segments && result.segments.length > 0 ? (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {result.segments.map((segment, index) => (
              <div
                key={index}
                className="group flex gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
              >
                <div className="flex-shrink-0">
                  <div className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-xs font-mono font-medium min-w-[100px] text-center">
                    {formatSegmentTimestamp(segment.startTime, segment.endTime)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-white leading-relaxed text-base">
                    {segment.text}
                  </p>
                  {segment.confidence !== undefined && segment.confidence !== null && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Confidence: {formatConfidence(segment.confidence)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap text-base">
              {result.transcriptionText}
            </p>
          </div>
        )}
      </div>


      {/* Model Information */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Model Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.modelUsed && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Model Used</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {result.modelUsed}
              </p>
            </div>
          )}
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatTimestamp(result.completedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
