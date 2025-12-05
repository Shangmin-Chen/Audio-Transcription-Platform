/**
 * Main App component for the Whisperrr audio transcription platform.
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              🎤 Whisperrr
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              AI-powered audio transcription platform
            </p>
          </header>

          <main className="max-w-4xl mx-auto">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="text-center mt-12 text-gray-500 dark:text-gray-400">
            <p>
              &copy; 2025 Whisperrr. Powered by{' '}
              <a
                href="https://github.com/guillaumekln/faster-whisper"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                faster-whisper
              </a>
              .
            </p>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
