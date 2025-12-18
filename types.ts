export interface FileData {
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  IMAGE_READY = 'IMAGE_READY',
  GENERATING_VIDEO = 'GENERATING_VIDEO',
  VIDEO_READY = 'VIDEO_READY',
  ERROR = 'ERROR'
}

export interface GenerationResult {
  imageUrl?: string;
  imageUrls?: string[]; // For multiple images
  videoUrl?: string;
}