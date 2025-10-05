/**
 * Validation utilities for model constraints
 * Based on data-model.md validation rules
 */

export class ValidationError extends Error {
  public errors: string[];

  constructor(message: string, errors: string[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export class ModelValidator {
  /**
   * Validate button area diameter
   */
  static validateDiameter(diameter: number): ValidationResult {
    const errors: string[] = [];

    if (diameter < 0.5) {
      errors.push('Diameter cannot be less than 0.5 inches');
    }
    if (diameter > 4.0) {
      errors.push('Diameter cannot be greater than 4.0 inches');
    }
    if (!Number.isFinite(diameter)) {
      errors.push('Diameter must be a valid number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate position within page bounds
   */
  static validatePosition(x: number, y: number, diameter: number, pageWidth: number = 8.5, pageHeight: number = 11.0): ValidationResult {
    const errors: string[] = [];
    const halfDiameter = diameter / 2;

    if (x - halfDiameter < 0) {
      errors.push('Button area extends beyond left page boundary');
    }
    if (x + halfDiameter > pageWidth) {
      errors.push('Button area extends beyond right page boundary');
    }
    if (y - halfDiameter < 0) {
      errors.push('Button area extends beyond top page boundary');
    }
    if (y + halfDiameter > pageHeight) {
      errors.push('Button area extends beyond bottom page boundary');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate crop coordinates (0-1 normalized)
   */
  static validateCrop(cropX: number, cropY: number): ValidationResult {
    const errors: string[] = [];

    if (cropX < 0.0 || cropX > 1.0) {
      errors.push('Crop X must be between 0.0 and 1.0');
    }
    if (cropY < 0.0 || cropY > 1.0) {
      errors.push('Crop Y must be between 0.0 and 1.0');
    }
    if (!Number.isFinite(cropX) || !Number.isFinite(cropY)) {
      errors.push('Crop coordinates must be valid numbers');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate zoom level
   */
  static validateZoom(zoom: number): ValidationResult {
    const errors: string[] = [];

    if (zoom < 0.1) {
      errors.push('Zoom cannot be less than 0.1x');
    }
    if (zoom > 5.0) {
      errors.push('Zoom cannot be greater than 5.0x');
    }
    if (!Number.isFinite(zoom)) {
      errors.push('Zoom must be a valid number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate rotation angle
   */
  static validateRotation(rotation: number): ValidationResult {
    const errors: string[] = [];

    if (rotation < 0 || rotation >= 360) {
      errors.push('Rotation must be between 0 and 360 degrees');
    }
    if (!Number.isFinite(rotation)) {
      errors.push('Rotation must be a valid number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate image dimensions
   */
  static validateImageDimensions(width: number, height: number): ValidationResult {
    const errors: string[] = [];

    if (width < 1 || width > 8192) {
      errors.push('Image width must be between 1 and 8192 pixels');
    }
    if (height < 1 || height > 8192) {
      errors.push('Image height must be between 1 and 8192 pixels');
    }
    if (!Number.isInteger(width) || !Number.isInteger(height)) {
      errors.push('Image dimensions must be integers');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate image file size
   */
  static validateFileSize(fileSize: number): ValidationResult {
    const errors: string[] = [];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (fileSize <= 0) {
      errors.push('File size must be greater than 0');
    }
    if (fileSize > maxSize) {
      errors.push('File size cannot exceed 50MB');
    }
    if (!Number.isInteger(fileSize)) {
      errors.push('File size must be an integer');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate image MIME type
   */
  static validateImageMimeType(mimeType: string): ValidationResult {
    const errors: string[] = [];
    const supportedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];

    if (!supportedTypes.includes(mimeType)) {
      errors.push(`Unsupported image format: ${mimeType}. Supported formats: ${supportedTypes.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate session name
   */
  static validateSessionName(name: string | null): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (name !== null) {
      if (name.length === 0) {
        errors.push('Session name cannot be empty');
      }
      if (name.length > 100) {
        errors.push('Session name cannot exceed 100 characters');
      }
      if (name.trim() !== name) {
        warnings.push('Session name has leading or trailing whitespace');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate page dimensions
   */
  static validatePageDimensions(width: number, height: number): ValidationResult {
    const errors: string[] = [];

    if (width < 4.0 || width > 17.0) {
      errors.push('Page width must be between 4.0 and 17.0 inches');
    }
    if (height < 6.0 || height > 22.0) {
      errors.push('Page height must be between 6.0 and 22.0 inches');
    }
    if (!Number.isFinite(width) || !Number.isFinite(height)) {
      errors.push('Page dimensions must be valid numbers');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate print DPI
   */
  static validatePrintDPI(dpi: number): ValidationResult {
    const errors: string[] = [];

    if (dpi < 150 || dpi > 600) {
      errors.push('Print DPI must be between 150 and 600');
    }
    if (!Number.isInteger(dpi)) {
      errors.push('Print DPI must be an integer');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate print margins
   */
  static validatePrintMargins(margins: { top: number; right: number; bottom: number; left: number }): ValidationResult {
    const errors: string[] = [];

    Object.entries(margins).forEach(([side, margin]) => {
      if (margin < 0.0 || margin > 2.0) {
        errors.push(`${side} margin must be between 0.0 and 2.0 inches`);
      }
      if (!Number.isFinite(margin)) {
        errors.push(`${side} margin must be a valid number`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}