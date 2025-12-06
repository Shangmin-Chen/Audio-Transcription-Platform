
export interface TranscriptionResultResponse {
  /** The complete transcribed text from the audio file */
  transcriptionText: string;
  
  /** Detected language code in ISO 639-1 format (e.g., "en", "es", "fr") */
  language?: string;
  
  /** Confidence score from 0.0 to 1.0 indicating transcription quality */
  confidence?: number;
  
  /** Duration of the audio file in seconds */
  duration?: number;
  
  /** Whisper model used for transcription (e.g., "base", "large") */
  modelUsed?: string;
  
  /** Processing time in seconds taken to transcribe the audio */
  processingTime?: number;
  
  /** Timestamp when transcription was completed */
  completedAt: string;
  
  /** Status of the transcription (should always be COMPLETED) */
  status: TranscriptionStatus;
  
  /** Individual segments with timing information */
  segments?: TranscriptionSegment[];
}

export interface TranscriptionSegment {
  /** Start time of the segment in seconds */
  startTime: number;
  
  /** End time of the segment in seconds */
  endTime: number;
  
  /** Transcribed text for this time segment */
  text: string;
  
  /** Confidence score for this segment (0.0 to 1.0) */
  confidence?: number;
}

export enum TranscriptionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}


export interface AudioFileInfo {
  /** Original filename of the uploaded file */
  filename: string;
  
  /** File size in bytes */
  size: number;
  
  /** Audio format/extension (e.g., "mp3", "wav") */
  format: string;
  
  /** MIME type of the audio file */
  mimeType: string;
  
  /** Duration of the audio file in seconds (if available) */
  duration?: number;
}

export interface TranscriptionError {
  /** Type of error that occurred */
  errorType: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Additional error details */
  details?: Record<string, any>;
  
  /** Request correlation ID for debugging */
  correlationId?: string;
  
  /** Timestamp when the error occurred */
  timestamp: string;
}

export type WhisperModelSize = 'tiny' | 'base' | 'small' | 'medium' | 'large' | 'large-v2' | 'large-v3';

export interface ModelInfo {
  /** Model size identifier */
  size: WhisperModelSize;
  
  /** Human-readable description */
  description: string;
  
  /** Model size in MB */
  sizeMB: number;
  
  /** Speed description */
  speed: string;
  
  /** Accuracy description */
  accuracy: string;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  { size: 'tiny', description: 'Fastest, least accurate', sizeMB: 39, speed: '~32x realtime', accuracy: 'Basic' },
  { size: 'base', description: 'Good balance of speed and accuracy', sizeMB: 74, speed: '~16x realtime', accuracy: 'Good' },
  { size: 'small', description: 'Better accuracy, slower', sizeMB: 244, speed: '~6x realtime', accuracy: 'Better' },
  { size: 'medium', description: 'Good accuracy, slower', sizeMB: 769, speed: '~2x realtime', accuracy: 'High' },
  { size: 'large', description: 'Best accuracy, slowest', sizeMB: 1550, speed: '~1x realtime', accuracy: 'Highest' },
  { size: 'large-v2', description: 'Best accuracy, slowest (v2)', sizeMB: 1550, speed: '~1x realtime', accuracy: 'Highest' },
  { size: 'large-v3', description: 'Best accuracy, slowest (v3)', sizeMB: 1550, speed: '~1x realtime', accuracy: 'Highest' },
];

export interface LanguageInfo {
  /** ISO 639-1 language code */
  code: string;
  
  /** Human-readable language name */
  name: string;
}

export const AVAILABLE_LANGUAGES: LanguageInfo[] = [
  { code: 'auto', name: 'Auto-detect' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
  { code: 'pl', name: 'Polish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'id', name: 'Indonesian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'he', name: 'Hebrew' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'cs', name: 'Czech' },
  { code: 'ro', name: 'Romanian' },
  { code: 'da', name: 'Danish' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'th', name: 'Thai' },
  { code: 'no', name: 'Norwegian' },
  { code: 'el', name: 'Greek' },
  { code: 'bg', name: 'Bulgarian' },
  { code: 'hr', name: 'Croatian' },
  { code: 'sk', name: 'Slovak' },
  { code: 'sl', name: 'Slovenian' },
  { code: 'sr', name: 'Serbian' },
  { code: 'et', name: 'Estonian' },
  { code: 'lv', name: 'Latvian' },
  { code: 'lt', name: 'Lithuanian' },
  { code: 'fa', name: 'Persian' },
  { code: 'ur', name: 'Urdu' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'kn', name: 'Kannada' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'mr', name: 'Marathi' },
  { code: 'pa', name: 'Punjabi' },
  { code: 'ne', name: 'Nepali' },
  { code: 'si', name: 'Sinhala' },
  { code: 'my', name: 'Myanmar' },
  { code: 'km', name: 'Khmer' },
  { code: 'lo', name: 'Lao' },
  { code: 'ka', name: 'Georgian' },
  { code: 'am', name: 'Amharic' },
  { code: 'az', name: 'Azerbaijani' },
  { code: 'be', name: 'Belarusian' },
  { code: 'bs', name: 'Bosnian' },
  { code: 'ca', name: 'Catalan' },
  { code: 'eu', name: 'Basque' },
  { code: 'gl', name: 'Galician' },
  { code: 'is', name: 'Icelandic' },
  { code: 'mk', name: 'Macedonian' },
  { code: 'sq', name: 'Albanian' },
  { code: 'sw', name: 'Swahili' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'ms', name: 'Malay' },
  { code: 'yo', name: 'Yoruba' },
  { code: 'so', name: 'Somali' },
  { code: 'uz', name: 'Uzbek' },
  { code: 'kk', name: 'Kazakh' },
  { code: 'mn', name: 'Mongolian' },
  { code: 'hy', name: 'Armenian' },
  { code: 'tg', name: 'Tajik' },
  { code: 'sd', name: 'Sindhi' },
  { code: 'ps', name: 'Pashto' },
  { code: 'tk', name: 'Turkmen' },
  { code: 'tt', name: 'Tatar' },
  { code: 'bo', name: 'Tibetan' },
  { code: 'lb', name: 'Luxembourgish' },
  { code: 'mt', name: 'Maltese' },
  { code: 'cy', name: 'Welsh' },
  { code: 'ga', name: 'Irish' },
  { code: 'br', name: 'Breton' },
  { code: 'oc', name: 'Occitan' },
  { code: 'co', name: 'Corsican' },
  { code: 'fy', name: 'Western Frisian' },
];

export interface TranscriptionOptions {
  /** Preferred Whisper model size */
  modelSize?: WhisperModelSize;
  
  /** Language hint for better accuracy (ISO 639-1 code) */
  language?: string;
  
  /** Temperature for sampling (0.0 = deterministic, higher = more random) */
  temperature?: number;
  
  /** Task type: transcribe or translate to English */
  task?: 'transcribe' | 'translate';
}

export interface JobSubmissionResponse {
  /** Unique job identifier */
  jobId: string;
  
  /** Initial job status */
  status: string;
  
  /** Status message */
  message: string;
}

export interface JobProgressResponse {
  /** Job identifier */
  jobId: string;
  
  /** Current job status */
  status: string;
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** Status message */
  message: string;
  
  /** Transcription result (available when status is COMPLETED) */
  result?: TranscriptionResultResponse;
  
  /** Error message (available when status is FAILED) */
  error?: string;
  
  /** Job creation timestamp */
  createdAt: string;
  
  /** Last update timestamp */
  updatedAt: string;
}