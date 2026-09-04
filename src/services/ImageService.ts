import { ImageAsset } from '@/models/ImageAsset';
import { ButtonArea } from '@/models/ButtonArea';
import { PrintConfiguration } from '@/models/PrintConfiguration';
import { ModelValidator } from '@/utils/validation';

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

export interface ImageServiceInterface {
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

export class ImageService implements ImageServiceInterface {
  private readonly SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/svg+xml'];
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  async loadImageFromFile(file: File): Promise<ImageLoadResult> {
    try {
      // Validate file first
      const validation = await this.validateImageFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = () => {
          const dataUrl = reader.result as string;
          const img = new Image();

          img.onload = () => {
            resolve({
              success: true,
              imageData: dataUrl,
              width: img.width,
              height: img.height
            });
          };

          img.onerror = () => {
            resolve({
              success: false,
              error: 'Failed to load image data'
            });
          };

          img.src = dataUrl;
        };

        reader.onerror = () => {
          resolve({
            success: false,
            error: 'Failed to read file'
          });
        };

        reader.readAsDataURL(file);
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async loadImageFromUrl(url: string): Promise<ImageLoadResult> {
    try {
      return new Promise((resolve) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              success: false,
              error: 'Failed to get canvas context'
            });
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const dataUrl = canvas.toDataURL('image/png');

          resolve({
            success: true,
            imageData: dataUrl,
            width: img.width,
            height: img.height
          });
        };

        img.onerror = () => {
          resolve({
            success: false,
            error: 'Failed to load image from URL'
          });
        };

        img.crossOrigin = 'anonymous';
        img.src = url;
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async validateImageFile(file: File): Promise<ValidationResult> {
    const errors: string[] = [];

    // MIME type validation
    const mimeResult = ModelValidator.validateImageMimeType(file.type);
    errors.push(...mimeResult.errors);

    // File size validation
    const sizeResult = ModelValidator.validateFileSize(file.size);
    errors.push(...sizeResult.errors);

    return {
      isValid: errors.length === 0,
      errors,
      fileSize: file.size,
      mimeType: file.type
    };
  }

  async generateThumbnail(imageData: string, maxWidth: number, maxHeight: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate thumbnail dimensions maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        let thumbWidth = maxWidth;
        let thumbHeight = maxWidth / aspectRatio;

        if (thumbHeight > maxHeight) {
          thumbHeight = maxHeight;
          thumbWidth = maxHeight * aspectRatio;
        }

        canvas.width = thumbWidth;
        canvas.height = thumbHeight;

        // Draw image scaled down
        ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);

        const thumbnailData = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailData);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for thumbnail generation'));
      };

      img.src = imageData;
    });
  }

  async optimizeForStorage(imageData: string, quality = 0.8): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Convert to JPEG with specified quality for compression
        const optimizedData = canvas.toDataURL('image/jpeg', quality);
        resolve(optimizedData);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for optimization'));
      };

      img.src = imageData;
    });
  }

  async cropToCircle(imageData: string, cropSettings: CropSettings): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        const diameter = cropSettings.diameter;
        canvas.width = diameter;
        canvas.height = diameter;

        const centerX = diameter / 2;
        const centerY = diameter / 2;
        const radius = diameter / 2;

        // Create circular clipping path
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();

        // Calculate source rectangle based on crop settings
        const scaledWidth = img.width * cropSettings.zoom;
        const scaledHeight = img.height * cropSettings.zoom;

        const sourceX = (cropSettings.x - 0.5) * scaledWidth;
        const sourceY = (cropSettings.y - 0.5) * scaledHeight;

        // Apply rotation if specified
        if (cropSettings.rotation !== 0) {
          ctx.translate(centerX, centerY);
          ctx.rotate((cropSettings.rotation * Math.PI) / 180);
          ctx.translate(-centerX, -centerY);
        }

        // Draw the cropped and scaled image
        ctx.drawImage(
          img,
          -sourceX, -sourceY,
          scaledWidth, scaledHeight
        );

        const croppedData = canvas.toDataURL('image/png');
        resolve(croppedData);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for circular crop'));
      };

      img.src = imageData;
    });
  }

  async applyTransform(imageData: string, transform: ImageTransform): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = transform.outputWidth;
        canvas.height = transform.outputHeight;

        const centerX = transform.outputWidth / 2;
        const centerY = transform.outputHeight / 2;

        // Apply transformations
        ctx.translate(centerX, centerY);

        if (transform.rotation !== 0) {
          ctx.rotate((transform.rotation * Math.PI) / 180);
        }

        // Calculate scaled dimensions and crop offset
        const scaledWidth = img.width * transform.zoom;
        const scaledHeight = img.height * transform.zoom;

        const cropOffsetX = (transform.cropX - 0.5) * scaledWidth;
        const cropOffsetY = (transform.cropY - 0.5) * scaledHeight;

        ctx.drawImage(
          img,
          -scaledWidth / 2 - cropOffsetX,
          -scaledHeight / 2 - cropOffsetY,
          scaledWidth,
          scaledHeight
        );

        const transformedData = canvas.toDataURL('image/png');
        resolve(transformedData);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for transformation'));
      };

      img.src = imageData;
    });
  }

  async createCanvasFromImage(imageData: string, width: number, height: number): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for canvas creation'));
      };

      img.src = imageData;
    });
  }

  async exportCanvasAsBlob(canvas: HTMLCanvasElement, format: 'png' | 'jpeg', quality = 0.92): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to export canvas as blob'));
        }
      }, mimeType, quality);
    });
  }

  async getImageDimensions(imageData: string): Promise<ImageDimensions> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height
        });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for dimension calculation'));
      };

      img.src = imageData;
    });
  }

  async renderButtonForPrint(buttonArea: ButtonArea, imageAsset: ImageAsset, dpi: number): Promise<HTMLCanvasElement> {
    // Calculate canvas size based on button diameter and DPI
    const diameterInPixels = Math.round((buttonArea.diameter * dpi));

    const canvas = document.createElement('canvas');
    canvas.width = diameterInPixels;
    canvas.height = diameterInPixels;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context for button rendering');
    }

    // Create circular clipping path
    const centerX = diameterInPixels / 2;
    const centerY = diameterInPixels / 2;
    const radius = diameterInPixels / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    // Render image if present
    if (imageAsset) {
      const img = new Image();
      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Apply button area transformations
          const scaledWidth = img.width * buttonArea.zoom;
          const scaledHeight = img.height * buttonArea.zoom;

          const cropOffsetX = (buttonArea.cropX - 0.5) * scaledWidth;
          const cropOffsetY = (buttonArea.cropY - 0.5) * scaledHeight;

          if (buttonArea.rotation !== 0) {
            ctx.translate(centerX, centerY);
            ctx.rotate((buttonArea.rotation * Math.PI) / 180);
            ctx.translate(-centerX, -centerY);
          }

          ctx.drawImage(
            img,
            centerX - scaledWidth / 2 - cropOffsetX,
            centerY - scaledHeight / 2 - cropOffsetY,
            scaledWidth,
            scaledHeight
          );

          resolve(canvas);
        };

        img.onerror = () => {
          reject(new Error('Failed to load image for button rendering'));
        };

        img.src = imageAsset.dataUrl;
      });
    } else {
      // Render empty button (placeholder or default design)
      ctx.fillStyle = '#f0f0f0';
      ctx.fill();
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 2;
      ctx.stroke();

      return Promise.resolve(canvas);
    }
  }

  async generatePrintLayout(buttonAreas: ButtonArea[], imageAssets: ImageAsset[], printConfig: PrintConfiguration): Promise<HTMLCanvasElement> {
    const canvasDimensions = printConfig.getCanvasDimensions();
    const canvas = document.createElement('canvas');
    canvas.width = canvasDimensions.width;
    canvas.height = canvasDimensions.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context for print layout');
    }

    // Fill background with white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render each button area
    const buttonPromises = buttonAreas.map(async (buttonArea) => {
      const imageAsset = imageAssets.find(asset => asset.id === buttonArea.imageAssetId);
      const buttonCanvas = await this.renderButtonForPrint(buttonArea, imageAsset!, printConfig.dpi);

      // Calculate position on print layout
      const xPixels = printConfig.inchesToPixels(buttonArea.x - buttonArea.diameter / 2);
      const yPixels = printConfig.inchesToPixels(buttonArea.y - buttonArea.diameter / 2);

      ctx.drawImage(buttonCanvas, xPixels, yPixels);
    });

    await Promise.all(buttonPromises);

    return canvas;
  }

  getSupportedFormats(): string[] {
    return [...this.SUPPORTED_FORMATS];
  }

  getMaxFileSize(): number {
    return this.MAX_FILE_SIZE;
  }

  isValidImageFormat(mimeType: string): boolean {
    return this.SUPPORTED_FORMATS.includes(mimeType);
  }
}