/**
 * Home Page Component for audio transcription workflow.
 * 
 * This is the main page component that orchestrates the complete transcription
 * workflow including file upload, model selection, transcription execution,
 * progress tracking, and results display.
 * 
 * Features:
 * - File upload with drag-and-drop support
 * - Model size selection
 * - Real-time progress tracking
 * - Transcription results display
 * - Error handling and user feedback
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */

import React, { useState } from 'react';
import { FileUpload } from '../components/upload/FileUpload';
import { Button } from '../components/common/Button';
import { ResultsView } from '../components/results/ResultsView';
import { ProgressBar } from '../components/common/ProgressBar';
import { ModelSelector } from '../components/common/ModelSelector';
import { DemoNotice } from '../components/common/DemoNotice';
import { useTranscription } from '../hooks/useTranscription';
import { WhisperModelSize } from '../types/transcription';
import { Upload, Mic, Zap, Shield, ArrowLeft } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedModel, setSelectedModel] = useState<WhisperModelSize>('base');
  
  const {
    transcribeAudio,
    transcriptionResult,
    isTranscribing,
    isCompleted,
    error,
    progress,
    statusMessage,
    clearError,
    reset,
  } = useTranscription();

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    clearError();
  };

  const handleTranscribe = async () => {
    if (!selectedFile) return;
    try {
      await transcribeAudio(selectedFile, selectedModel);
    } catch (error) {
      // Errors are handled by useTranscription hook which updates error state
      // No additional error handling needed here
    }
  };

  const handleStartOver = () => {
    setSelectedFile(null);
    reset();
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Demo Site Notice */}
      <DemoNotice />
      
      {/* Show results if transcription is completed */}
      {isCompleted && transcriptionResult ? (
        <div className="space-y-6">
          {/* Back to Upload Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleStartOver}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Transcribe Another File
            </Button>
          </div>
          
          {/* Results Display */}
          <ResultsView result={transcriptionResult} />
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <div className="text-center space-y-8 pt-8">
            <div className="flex justify-center">
              <div className="p-5 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl shadow-lg">
                <Mic className="h-16 w-16 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white tracking-tight">
                Transform Audio to Text
                <span className="block text-blue-600 dark:text-blue-400 mt-2">Instantly</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Upload your audio files and get accurate transcriptions with segment-level timestamps. 
                Powered by advanced AI transcription technology.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
              <div className="flex justify-center mb-5">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
                  <Zap className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Instant Results
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Get your transcriptions immediately with real-time progress tracking
              </p>
            </div>
            
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
              <div className="flex justify-center mb-5">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
                  <Shield className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Secure & Private
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Your files are processed securely and not stored permanently
              </p>
            </div>
            
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
              <div className="flex justify-center mb-5">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                  <Upload className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Multiple Formats
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Support for MP3, WAV, M4A, FLAC, OGG, and WMA files up to 50MB
              </p>
            </div>
          </div>

          {/* Upload Section */}
          <div className="max-w-3xl mx-auto">
            <div className="card p-8 lg:p-10 shadow-xl">
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Upload Your Audio
                  </h2>
                  <p className="text-lg text-gray-600 dark:text-gray-300">
                    Drag and drop your audio file or click to browse
                  </p>
                </div>

                <FileUpload
                  onFileSelect={handleFileSelect}
                  disabled={isTranscribing}
                />

                {/* Model Selection */}
                {selectedFile && (
                  <div className="transition-all duration-200">
                    <ModelSelector
                      selectedModel={selectedModel}
                      onModelChange={setSelectedModel}
                      disabled={isTranscribing}
                    />
                  </div>
                )}

                {selectedFile && !isTranscribing && (
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-center">
                      <Button
                        onClick={handleTranscribe}
                        size="lg"
                        className="w-full md:w-auto px-8 py-3 text-lg"
                      >
                        Transcribe Audio
                      </Button>
                    </div>
                    
                    <div className="text-center">
                      <Button
                        variant="ghost"
                        onClick={handleStartOver}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      >
                        Choose Different File
                      </Button>
                    </div>
                  </div>
                )}

                {isTranscribing && (
                  <div className="space-y-4">
                    <ProgressBar
                      progress={progress}
                      message={statusMessage || 'Processing...'}
                      showPercentage={true}
                    />
                  </div>
                )}

                {error && (
                  <div className="p-5 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-700 dark:text-red-300 text-center font-medium">
                      {error}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="max-w-5xl mx-auto pb-8">
            <div className="card p-8 lg:p-10">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                How it works
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Upload Audio
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Select your audio file using drag & drop or file browser
                  </p>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    AI Processing
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Our AI transcribes your audio with segment-level timestamps
                  </p>
                </div>
                
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">3</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    View Results
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    See your transcription with timestamps and quality metrics
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
