import { ValidationError, ModelValidator } from '@/utils/validation';

export interface PrintMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PrintConfigurationData {
  id: string;
  sessionId: string;
  dpi: number;
  paperSize: string;
  margins: PrintMargins;
  includeBleed: boolean;
  bleedSize: number;
  colorMode: string;
  createdAt: Date;
}

export type PaperSize = 'letter' | 'a4' | 'custom';
export type ColorMode = 'rgb' | 'cmyk';

export class PrintConfiguration implements PrintConfigurationData {
  public id: string;
  public sessionId: string;
  public dpi: number;
  public paperSize: string;
  public margins: PrintMargins;
  public includeBleed: boolean;
  public bleedSize: number;
  public colorMode: string;
  public createdAt: Date;

  constructor(data: Omit<PrintConfigurationData, 'id' | 'createdAt'> & {
    id?: string;
    createdAt?: Date;
  }) {
    this.id = data.id || this.generateId();
    this.sessionId = data.sessionId;
    this.dpi = data.dpi || 300;
    this.paperSize = data.paperSize || 'letter';
    this.margins = data.margins || { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 };
    this.includeBleed = data.includeBleed ?? false;
    this.bleedSize = data.bleedSize || 0.125;
    this.colorMode = data.colorMode || 'rgb';
    this.createdAt = data.createdAt || new Date();

    this.validate();
  }

  /**
   * Generate unique ID for print configuration
   */
  private generateId(): string {
    return `print-${crypto.randomUUID()}`;
  }

  /**
   * Validate print configuration data according to data-model.md rules
   */
  private validate(): void {
    const errors: string[] = [];

    // DPI validation: 150 <= dpi <= 600
    const dpiResult = ModelValidator.validatePrintDPI(this.dpi);
    errors.push(...dpiResult.errors);

    // Margins validation: 0.0 <= margin <= 2.0 inches
    const marginsResult = ModelValidator.validatePrintMargins(this.margins);
    errors.push(...marginsResult.errors);

    // Bleed size validation: 0.0 <= bleed <= 0.25 inches
    if (this.bleedSize < 0.0 || this.bleedSize > 0.25) {
      errors.push('Bleed size must be between 0.0 and 0.25 inches');
    }

    // Paper size validation
    const validPaperSizes = ['letter', 'a4', 'custom'];
    if (!validPaperSizes.includes(this.paperSize)) {
      errors.push(`Invalid paper size: ${this.paperSize}. Valid sizes: ${validPaperSizes.join(', ')}`);
    }

    // Color mode validation
    const validColorModes = ['rgb', 'cmyk'];
    if (!validColorModes.includes(this.colorMode)) {
      errors.push(`Invalid color mode: ${this.colorMode}. Valid modes: ${validColorModes.join(', ')}`);
    }

    // Session ID validation
    if (!this.sessionId || this.sessionId.trim().length === 0) {
      errors.push('Session ID is required');
    }

    if (errors.length > 0) {
      throw new ValidationError('PrintConfiguration validation failed', errors);
    }
  }

  /**
   * Get paper dimensions in inches
   */
  getPaperDimensions(): { width: number; height: number } {
    switch (this.paperSize) {
      case 'letter':
        return { width: 8.5, height: 11.0 };
      case 'a4':
        return { width: 8.27, height: 11.69 };
      case 'custom':
        // For custom, return letter as default
        return { width: 8.5, height: 11.0 };
      default:
        return { width: 8.5, height: 11.0 };
    }
  }

  /**
   * Get printable area dimensions (paper minus margins)
   */
  getPrintableArea(): { width: number; height: number } {
    const paper = this.getPaperDimensions();
    return {
      width: paper.width - this.margins.left - this.margins.right,
      height: paper.height - this.margins.top - this.margins.bottom,
    };
  }

  /**
   * Get total bleed area (printable area plus bleed)
   */
  getBleedArea(): { width: number; height: number } {
    const printable = this.getPrintableArea();
    const bleedOffset = this.includeBleed ? this.bleedSize * 2 : 0;
    return {
      width: printable.width + bleedOffset,
      height: printable.height + bleedOffset,
    };
  }

  /**
   * Calculate pixels per inch based on DPI
   */
  getPixelsPerInch(): number {
    return this.dpi;
  }

  /**
   * Convert inches to pixels at current DPI
   */
  inchesToPixels(inches: number): number {
    return Math.round(inches * this.dpi);
  }

  /**
   * Convert pixels to inches at current DPI
   */
  pixelsToInches(pixels: number): number {
    return pixels / this.dpi;
  }

  /**
   * Get print canvas dimensions in pixels
   */
  getCanvasDimensions(): { width: number; height: number } {
    const area = this.getBleedArea();
    return {
      width: this.inchesToPixels(area.width),
      height: this.inchesToPixels(area.height),
    };
  }

  /**
   * Check if configuration is suitable for professional printing
   */
  isProfessionalQuality(): boolean {
    return this.dpi >= 300 && this.includeBleed && this.colorMode === 'cmyk';
  }

  /**
   * Check if configuration is optimized for web printing
   */
  isWebOptimized(): boolean {
    return this.dpi <= 300 && !this.includeBleed && this.colorMode === 'rgb';
  }

  /**
   * Get quality assessment
   */
  getQualityAssessment(): 'draft' | 'standard' | 'high' | 'professional' {
    if (this.dpi < 200) {
      return 'draft';
    } else if (this.dpi < 300) {
      return 'standard';
    } else if (this.dpi < 600 && !this.includeBleed) {
      return 'high';
    } else {
      return 'professional';
    }
  }

  /**
   * Calculate estimated file size for print output (rough estimate)
   */
  getEstimatedFileSize(): number {
    const canvas = this.getCanvasDimensions();
    const bytesPerPixel = this.colorMode === 'cmyk' ? 4 : 3;
    const rawSize = canvas.width * canvas.height * bytesPerPixel;

    // Apply compression estimate (JPEG ~10:1, PNG ~3:1)
    const compressionRatio = 5; // Average
    return Math.round(rawSize / compressionRatio);
  }

  /**
   * Get formatted file size estimate
   */
  getFormattedFileSize(): string {
    const size = this.getEstimatedFileSize();
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitSize = size;
    let unitIndex = 0;

    while (unitSize >= 1024 && unitIndex < units.length - 1) {
      unitSize /= 1024;
      unitIndex++;
    }

    return `${unitSize.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Update print configuration properties with validation
   */
  update(updates: Partial<Omit<PrintConfigurationData, 'id' | 'sessionId' | 'createdAt'>>): void {
    Object.assign(this, updates);
    this.validate();
  }

  /**
   * Convert to plain data object
   */
  toData(): PrintConfigurationData {
    return {
      id: this.id,
      sessionId: this.sessionId,
      dpi: this.dpi,
      paperSize: this.paperSize,
      margins: { ...this.margins },
      includeBleed: this.includeBleed,
      bleedSize: this.bleedSize,
      colorMode: this.colorMode,
      createdAt: this.createdAt,
    };
  }

  /**
   * Create PrintConfiguration from data
   */
  static fromData(data: PrintConfigurationData): PrintConfiguration {
    return new PrintConfiguration(data);
  }

  /**
   * Create default print configuration for session
   */
  static createDefault(sessionId: string): PrintConfiguration {
    return new PrintConfiguration({
      sessionId,
      dpi: 300,
      paperSize: 'letter',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      includeBleed: false,
      bleedSize: 0.125,
      colorMode: 'rgb',
    });
  }

  /**
   * Create high-quality print configuration
   */
  static createHighQuality(sessionId: string): PrintConfiguration {
    return new PrintConfiguration({
      sessionId,
      dpi: 600,
      paperSize: 'letter',
      margins: { top: 0.25, right: 0.25, bottom: 0.25, left: 0.25 },
      includeBleed: true,
      bleedSize: 0.125,
      colorMode: 'cmyk',
    });
  }

  /**
   * Create web-optimized print configuration
   */
  static createWebOptimized(sessionId: string): PrintConfiguration {
    return new PrintConfiguration({
      sessionId,
      dpi: 200,
      paperSize: 'letter',
      margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
      includeBleed: false,
      bleedSize: 0,
      colorMode: 'rgb',
    });
  }

  /**
   * Get supported paper sizes
   */
  static getSupportedPaperSizes(): PaperSize[] {
    return ['letter', 'a4', 'custom'];
  }

  /**
   * Get supported color modes
   */
  static getSupportedColorModes(): ColorMode[] {
    return ['rgb', 'cmyk'];
  }

  /**
   * Get DPI recommendations
   */
  static getDPIRecommendations(): { draft: number; standard: number; high: number; professional: number } {
    return {
      draft: 150,
      standard: 200,
      high: 300,
      professional: 600,
    };
  }
}