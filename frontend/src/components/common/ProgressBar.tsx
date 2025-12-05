/**
 * Progress Bar Component for displaying transcription progress.
 * 
 * This component displays a visual progress bar with percentage and status message.
 */

import React from 'react';

export interface ProgressBarProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Status message to display */
  message?: string;
  /** Whether to show percentage text */
  showPercentage?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Progress bar component with animated fill and optional status message.
 * 
 * Features:
 *   - Smooth animation for progress updates
 *   - Optional percentage display
 *   - Status message support
 *   - Accessible ARIA attributes
 *   - Tailwind CSS styling
 * 
 * @param props ProgressBar component props
 * @returns ProgressBar component
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  message,
  showPercentage = true,
  className = ''
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar container */}
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
        <div
          className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${clampedProgress}%`}
        />
      </div>
      
      {/* Status text */}
      <div className="mt-2 flex justify-between items-center text-sm">
        {message && (
          <span className="text-gray-600 flex-1">{message}</span>
        )}
        {showPercentage && (
          <span className="text-gray-700 font-medium ml-2">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;

