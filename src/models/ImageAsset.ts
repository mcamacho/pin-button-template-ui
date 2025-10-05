import { ValidationError, ModelValidator } from '@/utils/validation';

export interface ImageAssetData {
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

export class ImageAsset implements ImageAssetData {
  public id: string;
  public filename: string;
  public mimeType: string;
  public width: number;
  public height: number;
  public fileSize: number;
  public dataUrl: string;
  public thumbnailUrl: string;
  public uploadedAt: Date;
  public lastUsedAt: Date;

  constructor(data: Omit<ImageAssetData, 'id' | 'uploadedAt' | 'lastUsedAt'> & {
    id?: string;
    uploadedAt?: Date;
    lastUsedAt?: Date;
  }) {
    this.id = data.id || this.generateId();
    this.filename = data.filename;
    this.mimeType = data.mimeType;
    this.width = data.width;
    this.height = data.height;
    this.fileSize = data.fileSize;
    this.dataUrl = data.dataUrl;
    this.thumbnailUrl = data.thumbnailUrl;
    this.uploadedAt = data.uploadedAt || new Date();
    this.lastUsedAt = data.lastUsedAt || new Date();

    this.validate();
  }

  /**
   * Generate unique ID for image asset
   */
  private generateId(): string {
    return `img-${crypto.randomUUID()}`;
  }

  /**
   * Validate image asset data according to data-model.md rules
   */
  private validate(): void {
    const errors: string[] = [];

    // MIME type validation
    const mimeResult = ModelValidator.validateImageMimeType(this.mimeType);
    errors.push(...mimeResult.errors);

    // Dimensions validation
    const dimensionsResult = ModelValidator.validateImageDimensions(this.width, this.height);
    errors.push(...dimensionsResult.errors);

    // File size validation
    const sizeResult = ModelValidator.validateFileSize(this.fileSize);
    errors.push(...sizeResult.errors);

    // Data URL validation
    if (!this.isValidDataUrl(this.dataUrl)) {
      errors.push('Invalid base64 image data URL');
    }

    // Thumbnail validation
    if (!this.isValidDataUrl(this.thumbnailUrl)) {
      errors.push('Invalid base64 thumbnail data URL');
    }

    // Filename validation
    if (!this.filename || this.filename.trim().length === 0) {
      errors.push('Filename is required');
    }

    if (errors.length > 0) {
      throw new ValidationError('ImageAsset validation failed', errors);
    }
  }

  /**
   * Validate base64 data URL format
   */
  private isValidDataUrl(dataUrl: string): boolean {
    const dataUrlRegex = /^data:image\/(png|jpe?g|svg\+xml);base64,([A-Za-z0-9+/=]+)$/;
    return dataUrlRegex.test(dataUrl);
  }

  /**
   * Update last used timestamp
   */
  markAsUsed(): void {
    this.lastUsedAt = new Date();
  }

  /**
   * Get aspect ratio of image
   */
  getAspectRatio(): number {
    if (this.height === 0) {
      return 1;
    }
    return this.width / this.height;
  }

  /**
   * Check if image is landscape orientation
   */
  isLandscape(): boolean {
    return this.width > this.height;
  }

  /**
   * Check if image is portrait orientation
   */
  isPortrait(): boolean {
    return this.height > this.width;
  }

  /**
   * Check if image is square
   */
  isSquare(): boolean {
    return this.width === this.height;
  }

  /**
   * Get image format from MIME type
   */
  getFormat(): 'jpeg' | 'png' | 'svg' {
    switch (this.mimeType) {
      case 'image/jpeg':
        return 'jpeg';
      case 'image/png':
        return 'png';
      case 'image/svg+xml':
        return 'svg';
      default:
        throw new Error(`Unsupported MIME type: ${this.mimeType}`);
    }
  }

  /**
   * Get human-readable file size
   */
  getFormattedFileSize(): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.fileSize;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Check if image is considered large (> 10MB)
   */
  isLargeFile(): boolean {
    return this.fileSize > 10 * 1024 * 1024;
  }

  /**
   * Check if image dimensions are high-resolution (> 2048px either dimension)
   */
  isHighResolution(): boolean {
    return this.width > 2048 || this.height > 2048;
  }

  /**
   * Get dimensions as string
   */
  getDimensionsString(): string {
    return `${this.width} × ${this.height}`;
  }

  /**
   * Calculate thumbnail dimensions while maintaining aspect ratio
   */
  calculateThumbnailDimensions(maxWidth: number, maxHeight: number): { width: number; height: number } {
    const aspectRatio = this.getAspectRatio();

    let thumbWidth = maxWidth;
    let thumbHeight = maxWidth / aspectRatio;

    if (thumbHeight > maxHeight) {
      thumbHeight = maxHeight;
      thumbWidth = maxHeight * aspectRatio;
    }

    return {
      width: Math.round(thumbWidth),
      height: Math.round(thumbHeight),
    };
  }

  /**
   * Check if image is older than specified days
   */
  isOlderThan(days: number): boolean {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    return this.lastUsedAt < cutoffDate;
  }

  /**
   * Convert to plain data object
   */
  toData(): ImageAssetData {
    return {
      id: this.id,
      filename: this.filename,
      mimeType: this.mimeType,
      width: this.width,
      height: this.height,
      fileSize: this.fileSize,
      dataUrl: this.dataUrl,
      thumbnailUrl: this.thumbnailUrl,
      uploadedAt: this.uploadedAt,
      lastUsedAt: this.lastUsedAt,
    };
  }

  /**
   * Create ImageAsset from data
   */
  static fromData(data: ImageAssetData): ImageAsset {
    return new ImageAsset(data);
  }

  /**
   * Create ImageAsset from File object
   */
  static async fromFile(file: File): Promise<ImageAsset> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        try {
          const dataUrl = reader.result as string;

          // Create image element to get dimensions
          const img = new Image();
          img.onload = () => {
            try {
              // Generate thumbnail (placeholder - would need canvas in real implementation)
              const thumbnailUrl = dataUrl; // Simplified for now

              const imageAsset = new ImageAsset({
                filename: file.name,
                mimeType: file.type,
                width: img.width,
                height: img.height,
                fileSize: file.size,
                dataUrl,
                thumbnailUrl,
              });

              resolve(imageAsset);
            } catch (error) {
              reject(error);
            }
          };

          img.onerror = () => {
            reject(new Error('Failed to load image for dimension calculation'));
          };

          img.src = dataUrl;
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Get supported MIME types
   */
  static getSupportedMimeTypes(): string[] {
    return ['image/jpeg', 'image/png', 'image/svg+xml'];
  }

  /**
   * Check if MIME type is supported
   */
  static isSupportedMimeType(mimeType: string): boolean {
    return ImageAsset.getSupportedMimeTypes().includes(mimeType);
  }

  /**
   * Get maximum file size in bytes
   */
  static getMaxFileSize(): number {
    return 50 * 1024 * 1024; // 50MB
  }

  /**
   * Get maximum dimensions
   */
  static getMaxDimensions(): { width: number; height: number } {
    return { width: 8192, height: 8192 };
  }
}