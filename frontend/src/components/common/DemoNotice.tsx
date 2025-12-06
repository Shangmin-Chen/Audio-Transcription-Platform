/**
 * Demo Notice Component for displaying demo site constraints and information.
 * 
 * This component displays a prominent but non-intrusive banner showing
 * that this is a demo site with specific constraints that can be configured.
 * 
 * @author shangmin
 * @version 1.0
 * @since 2024
 */

import React from 'react';
import { Info, Settings } from 'lucide-react';
import { clsx } from 'clsx';
import { APP_CONFIG } from '../../utils/constants';
import { formatFileSize } from '../../utils/fileValidation';

interface DemoNoticeProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * DemoNotice component displays demo site constraints and configuration information.
 */
export const DemoNotice: React.FC<DemoNoticeProps> = ({ className }) => {
  const maxFileSizeFormatted = formatFileSize(APP_CONFIG.maxFileSize);
  const supportedFormats = APP_CONFIG.supportedExtensions
    .map(ext => ext.toUpperCase().replace('.', ''))
    .join(', ');

  return (
    <div
      className={clsx(
        'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
        'border border-blue-200 dark:border-blue-800 rounded-lg p-4',
        'shadow-sm',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Demo Site
            </h3>
            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
              Constraints Apply
            </span>
          </div>
          
          <div className="space-y-1.5 text-sm text-blue-800 dark:text-blue-200">
            <p>
              <strong>File Size Limit:</strong> {maxFileSizeFormatted}
            </p>
            <p>
              <strong>Supported Formats:</strong> {supportedFormats}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 flex items-center gap-1">
              <Settings className="h-3 w-3" />
              These constraints can be modified in configuration files (config.py, application.properties, constants.ts)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


