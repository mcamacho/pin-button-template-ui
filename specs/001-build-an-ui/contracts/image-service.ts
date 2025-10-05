/**
 * Image Service Contract
 * Defines the interface for image processing and file handling operations
 */

export interface ImageService {
  // File Input Operations
  loadImageFromFile(file: File): Promise<ImageLoadResult>;
  loadImageFromUrl(url: string): Promise<ImageLoadResult>;
  validateImageFile(file: File): Promise<ValidationResult>;

  // Image Processing
  generateThumbnail(imageData: string, maxWidth: number, maxHeight: number): Promise<string>;
  optimizeForStorage(imageData: string, quality?: number): Promise<string>;
  cropToCircle(imageData: string, cropSettings: CropSettings): Promise<string>;
  applyTransform(imageData: string, transform: ImageTransform): Promise<string>;

  // Canvas Operations
  createCanvasFromImage(imageData: string, width: number, height: number): Promise<HTMLCanvasElement>;
  exportCanvasAsBlob(canvas: HTMLCanvasElement, format: 'png' | 'jpeg', quality?: number): Promise<Blob>;
  getImageDimensions(imageData: string): Promise<ImageDimensions>;

  // Print Preparation
  renderButtonForPrint(buttonArea: ButtonArea, imageAsset: ImageAsset, dpi: number): Promise<HTMLCanvasElement>;
  generatePrintLayout(buttonAreas: ButtonArea[], imageAssets: ImageAsset[], printConfig: PrintConfiguration): Promise<HTMLCanvasElement>;

  // Validation and Utilities
  getSupportedFormats(): string[];
  getMaxFileSize(): number;
  isValidImageFormat(mimeType: string): boolean;
}

// Supporting types
export interface ImageLoadResult {
  success: boolean;
  imageData?: string;
  width?: number;
  height?: number;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fileSize: number;
  mimeType: string;
}

export interface CropSettings {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  zoom: number;
  rotation: number;
  diameter: number; // in pixels
}

export interface ImageTransform {
  cropX: number;
  cropY: number;
  zoom: number;
  rotation: number;
  outputWidth: number;
  outputHeight: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

// Re-export types from database service for consistency
export interface ButtonArea {
  id: string;
  sessionId: string;
  x: number;
  y: number;
  diameter: number;
  imageAssetId: string | null;
  cropX: number;
  cropY: number;
  zoom: number;
  rotation: number;
}

export interface ImageAsset {
  id: string;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
  dataUrl: string;
  thumbnailUrl: string;
  uploadedAt: Date;
  lastUsedAt: Date;
}

export interface PrintConfiguration {
  id: string;
  sessionId: string;
  dpi: number;
  paperSize: string;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  includeBleed: boolean;
  bleedSize: number;
  colorMode: string;
  createdAt: Date;
}