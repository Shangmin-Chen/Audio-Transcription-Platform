/**
 * Model Selector Component for choosing Whisper model size.
 * 
 * This component provides a dropdown interface for users to select
 * the Whisper model size for transcription, with descriptions of
 * each model's characteristics.
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */

import React from 'react';
import { WhisperModelSize, AVAILABLE_MODELS } from '../../types/transcription';
import { Info } from 'lucide-react';

interface ModelSelectorProps {
  /** Currently selected model size */
  selectedModel: WhisperModelSize;
  
  /** Callback when model selection changes */
  onModelChange: (model: WhisperModelSize) => void;
  
  /** Whether the component is disabled */
  disabled?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * ModelSelector component for choosing Whisper model size.
 */
export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  disabled = false,
  className = '',
}) => {
  const selectedModelInfo = AVAILABLE_MODELS.find(m => m.size === selectedModel);

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Model Size
      </label>
      
      <div className="relative">
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value as WhisperModelSize)}
          disabled={disabled}
          className={`
            w-full px-4 py-2 pr-10
            bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600
            rounded-lg
            text-gray-900 dark:text-white
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            appearance-none
            cursor-pointer
          `}
        >
          {AVAILABLE_MODELS.map((model) => (
            <option key={model.size} value={model.size}>
              {model.size.charAt(0).toUpperCase() + model.size.slice(1)} - {model.description}
            </option>
          ))}
        </select>
        
        {/* Custom dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
      
      {/* Model Info */}
      {selectedModelInfo && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">
              {selectedModelInfo.size.charAt(0).toUpperCase() + selectedModelInfo.size.slice(1)} Model
            </p>
            <p className="text-blue-600 dark:text-blue-400">
              Size: {selectedModelInfo.sizeMB} MB • Speed: {selectedModelInfo.speed} • Accuracy: {selectedModelInfo.accuracy}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

