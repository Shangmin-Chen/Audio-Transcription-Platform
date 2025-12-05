/**
 * Language Selector Component for choosing output language.
 * 
 * This component provides a dropdown interface for users to select
 * the output language (transcription language) for transcription.
 * Input language is always auto-detected.
 * 
 * @author shangmin
 * @version 2.0
 * @since 2024
 */

import React from 'react';
import { AVAILABLE_LANGUAGES, LanguageInfo } from '../../types/transcription';
import { Info, Languages } from 'lucide-react';

interface LanguageSelectorProps {
  /** Currently selected output language code */
  outputLanguage: string;
  
  /** Callback when output language selection changes */
  onOutputLanguageChange: (language: string) => void;
  
  /** Whether the component is disabled */
  disabled?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * LanguageSelector component for choosing output language.
 * Input language is always auto-detected.
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  outputLanguage,
  onOutputLanguageChange,
  disabled = false,
  className = '',
}) => {
  // Filter out "auto" from output language options
  const outputLanguageOptions = AVAILABLE_LANGUAGES.filter(lang => lang.code !== 'auto');
  
  // Get display name for selected output language
  const outputLangInfo = AVAILABLE_LANGUAGES.find(lang => lang.code === outputLanguage);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Languages className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Output Language
        </label>
      </div>
      
      {/* Output Language Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
          Transcription Language
        </label>
        
        <div className="relative">
          <select
            value={outputLanguage}
            onChange={(e) => onOutputLanguageChange(e.target.value)}
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
            {outputLanguageOptions.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
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
      </div>
      
      {/* Language Info */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">
            Auto-detecting audio language • Output: {outputLangInfo?.name || outputLanguage}
          </p>
          <p className="text-blue-600 dark:text-blue-400">
            {outputLanguage === 'en' 
              ? 'The system will automatically detect the source language and translate it to English.'
              : `The system will automatically detect the source language and transcribe it in ${outputLangInfo?.name || outputLanguage}.`}
          </p>
        </div>
      </div>
    </div>
  );
};

