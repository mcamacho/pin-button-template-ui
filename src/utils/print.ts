/**
 * Print utilities for DPI and paper size handling
 * Handles conversion between units and print optimization
 */

export interface PaperSpec {
  name: string;
  width: number; // inches
  height: number; // inches
  widthMM: number;
  heightMM: number;
}

export interface PrintUnits {
  inches: number;
  millimeters: number;
  pixels: number;
  points: number; // PostScript points (1/72 inch)
}

export interface ColorProfile {
  name: string;
  channels: number;
  gamut: 'sRGB' | 'AdobeRGB' | 'P3' | 'CMYK';
  description: string;
}

export interface PrintQualityProfile {
  name: string;
  dpi: number;
  colorMode: 'rgb' | 'cmyk';
  compression: number; // 0-1
  antialiasing: boolean;
  description: string;
}

export class PrintUtils {
  // Standard paper sizes (in inches)
  static readonly PAPER_SIZES: Record<string, PaperSpec> = {
    letter: {
      name: 'Letter',
      width: 8.5,
      height: 11.0,
      widthMM: 215.9,
      heightMM: 279.4
    },
    legal: {
      name: 'Legal',
      width: 8.5,
      height: 14.0,
      widthMM: 215.9,
      heightMM: 355.6
    },
    a4: {
      name: 'A4',
      width: 8.27,
      height: 11.69,
      widthMM: 210.0,
      heightMM: 297.0
    },
    a3: {
      name: 'A3',
      width: 11.69,
      height: 16.54,
      widthMM: 297.0,
      heightMM: 420.0
    },
    tabloid: {
      name: 'Tabloid',
      width: 11.0,
      height: 17.0,
      widthMM: 279.4,
      heightMM: 431.8
    }
  };

  // Standard print quality profiles
  static readonly QUALITY_PROFILES: Record<string, PrintQualityProfile> = {
    draft: {
      name: 'Draft',
      dpi: 150,
      colorMode: 'rgb',
      compression: 0.3,
      antialiasing: false,
      description: 'Fast printing for proofs and drafts'
    },
    standard: {
      name: 'Standard',
      dpi: 300,
      colorMode: 'rgb',
      compression: 0.7,
      antialiasing: true,
      description: 'Good quality for general use'
    },
    high: {
      name: 'High Quality',
      dpi: 600,
      colorMode: 'rgb',
      compression: 0.9,
      antialiasing: true,
      description: 'High quality for presentations'
    },
    professional: {
      name: 'Professional',
      dpi: 600,
      colorMode: 'cmyk',
      compression: 1.0,
      antialiasing: true,
      description: 'Professional print quality with CMYK'
    }
  };

  // Color profiles
  static readonly COLOR_PROFILES: Record<string, ColorProfile> = {
    srgb: {
      name: 'sRGB',
      channels: 3,
      gamut: 'sRGB',
      description: 'Standard RGB for web and general use'
    },
    adobergb: {
      name: 'Adobe RGB',
      channels: 3,
      gamut: 'AdobeRGB',
      description: 'Extended RGB gamut for photography'
    },
    cmyk: {
      name: 'CMYK',
      channels: 4,
      gamut: 'CMYK',
      description: 'Cyan, Magenta, Yellow, Key (Black) for professional printing'
    }
  };

  /**
   * Convert between different units
   */
  static convertUnits(value: number, fromUnit: keyof PrintUnits, toUnit: keyof PrintUnits, dpi: number = 300): number {
    // Convert to inches first
    let inches: number;

    switch (fromUnit) {
      case 'inches':
        inches = value;
        break;
      case 'millimeters':
        inches = value / 25.4;
        break;
      case 'pixels':
        inches = value / dpi;
        break;
      case 'points':
        inches = value / 72;
        break;
      default:
        throw new Error(`Unknown unit: ${fromUnit}`);
    }

    // Convert from inches to target unit
    switch (toUnit) {
      case 'inches':
        return inches;
      case 'millimeters':
        return inches * 25.4;
      case 'pixels':
        return inches * dpi;
      case 'points':
        return inches * 72;
      default:
        throw new Error(`Unknown unit: ${toUnit}`);
    }
  }

  /**
   * Get all conversions for a value
   */
  static getAllUnitConversions(value: number, fromUnit: keyof PrintUnits, dpi: number = 300): PrintUnits {
    return {
      inches: this.convertUnits(value, fromUnit, 'inches', dpi),
      millimeters: this.convertUnits(value, fromUnit, 'millimeters', dpi),
      pixels: this.convertUnits(value, fromUnit, 'pixels', dpi),
      points: this.convertUnits(value, fromUnit, 'points', dpi)
    };
  }

  /**
   * Calculate DPI needed for specific output size
   */
  static calculateRequiredDPI(
    sourcePixelWidth: number,
    sourcePixelHeight: number,
    targetInchWidth: number,
    targetInchHeight: number
  ): { horizontal: number; vertical: number; recommended: number } {
    const horizontalDPI = sourcePixelWidth / targetInchWidth;
    const verticalDPI = sourcePixelHeight / targetInchHeight;

    return {
      horizontal: horizontalDPI,
      vertical: verticalDPI,
      recommended: Math.max(horizontalDPI, verticalDPI)
    };
  }

  /**
   * Calculate output dimensions at specific DPI
   */
  static calculateOutputDimensions(
    sourcePixelWidth: number,
    sourcePixelHeight: number,
    dpi: number
  ): { width: PrintUnits; height: PrintUnits } {
    const widthInches = sourcePixelWidth / dpi;
    const heightInches = sourcePixelHeight / dpi;

    return {
      width: this.getAllUnitConversions(widthInches, 'inches', dpi),
      height: this.getAllUnitConversions(heightInches, 'inches', dpi)
    };
  }

  /**
   * Get optimal DPI for button diameter and print quality
   */
  static getOptimalDPI(buttonDiameterInches: number, quality: 'draft' | 'standard' | 'high' | 'professional'): number {
    const profile = this.QUALITY_PROFILES[quality];
    if (!profile) {
      throw new Error(`Unknown quality profile: ${quality}`);
    }

    // For very small buttons, increase DPI to maintain detail
    if (buttonDiameterInches < 1.0) {
      return Math.min(profile.dpi * 1.5, 600);
    }

    // For large buttons, standard DPI is sufficient
    if (buttonDiameterInches > 3.0) {
      return Math.max(profile.dpi * 0.8, 200);
    }

    return profile.dpi;
  }

  /**
   * Calculate estimated file size for print job
   */
  static estimateFileSize(
    widthPixels: number,
    heightPixels: number,
    colorMode: 'rgb' | 'cmyk',
    compression: number = 0.7
  ): { bytes: number; formatted: string } {
    const channelsPerPixel = colorMode === 'cmyk' ? 4 : 3;
    const rawBytes = widthPixels * heightPixels * channelsPerPixel;

    // Apply compression estimate
    const compressedBytes = Math.round(rawBytes * (1 - compression));

    return {
      bytes: compressedBytes,
      formatted: this.formatFileSize(compressedBytes)
    };
  }

  /**
   * Format file size in human-readable format
   */
  static formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Calculate print margins for different printer types
   */
  static getPrinterMargins(printerType: 'inkjet' | 'laser' | 'professional'): {
    minimum: { top: number; right: number; bottom: number; left: number };
    recommended: { top: number; right: number; bottom: number; left: number };
  } {
    switch (printerType) {
      case 'inkjet':
        return {
          minimum: { top: 0.25, right: 0.25, bottom: 0.25, left: 0.25 },
          recommended: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 }
        };
      case 'laser':
        return {
          minimum: { top: 0.2, right: 0.2, bottom: 0.2, left: 0.2 },
          recommended: { top: 0.4, right: 0.4, bottom: 0.4, left: 0.4 }
        };
      case 'professional':
        return {
          minimum: { top: 0.125, right: 0.125, bottom: 0.125, left: 0.125 },
          recommended: { top: 0.25, right: 0.25, bottom: 0.25, left: 0.25 }
        };
      default:
        throw new Error(`Unknown printer type: ${printerType}`);
    }
  }

  /**
   * Generate CSS for specific print settings
   */
  static generatePrintCSS(
    paperSize: string,
    margins: { top: number; right: number; bottom: number; left: number },
    dpi: number,
    colorMode: 'rgb' | 'cmyk'
  ): string {
    const paper = this.PAPER_SIZES[paperSize.toLowerCase()];
    if (!paper) {
      throw new Error(`Unknown paper size: ${paperSize}`);
    }

    return `
      @media print {
        @page {
          size: ${paper.width}in ${paper.height}in;
          margin: ${margins.top}in ${margins.right}in ${margins.bottom}in ${margins.left}in;
        }

        body {
          margin: 0;
          padding: 0;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          image-rendering: ${dpi >= 300 ? 'auto' : 'pixelated'};
        }

        img {
          image-rendering: ${dpi >= 300 ? 'auto' : 'pixelated'};
          max-width: 100%;
          height: auto;
        }

        .print-no-break {
          page-break-inside: avoid;
        }

        .print-break-after {
          page-break-after: always;
        }

        .screen-only {
          display: none !important;
        }
      }
    `;
  }

  /**
   * Validate print settings for quality and compatibility
   */
  static validatePrintSettings(settings: {
    dpi: number;
    paperSize: string;
    buttonDiameter: number;
    colorMode: 'rgb' | 'cmyk';
  }): { valid: boolean; warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    // DPI validation
    if (settings.dpi < 150) {
      errors.push('DPI below 150 will result in poor print quality');
    } else if (settings.dpi < 200) {
      warnings.push('DPI below 200 may result in visible pixelation');
    }

    if (settings.dpi > 600) {
      warnings.push('DPI above 600 may result in very large file sizes with minimal quality improvement');
    }

    // Paper size validation
    if (!this.PAPER_SIZES[settings.paperSize.toLowerCase()]) {
      errors.push(`Unknown paper size: ${settings.paperSize}`);
    }

    // Button diameter vs DPI
    const buttonPixels = settings.buttonDiameter * settings.dpi;
    if (buttonPixels < 100) {
      warnings.push('Button will be very small in pixels, consider increasing DPI or button size');
    }

    if (buttonPixels > 2400) {
      warnings.push('Button will be very large in pixels, file size may be excessive');
    }

    // Color mode recommendations
    if (settings.colorMode === 'cmyk' && settings.dpi < 300) {
      warnings.push('CMYK color mode typically requires 300+ DPI for best results');
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Calculate bleed area for professional printing
   */
  static calculateBleedArea(
    pageWidth: number,
    pageHeight: number,
    bleedSize: number = 0.125
  ): {
    totalWidth: number;
    totalHeight: number;
    bleedOffsets: { top: number; right: number; bottom: number; left: number };
  } {
    return {
      totalWidth: pageWidth + (bleedSize * 2),
      totalHeight: pageHeight + (bleedSize * 2),
      bleedOffsets: {
        top: bleedSize,
        right: bleedSize,
        bottom: bleedSize,
        left: bleedSize
      }
    };
  }

  /**
   * Get recommended settings for specific use cases
   */
  static getRecommendedSettings(useCase: 'home' | 'office' | 'professional' | 'commercial'): {
    dpi: number;
    colorMode: 'rgb' | 'cmyk';
    paperSize: string;
    margins: { top: number; right: number; bottom: number; left: number };
    includeBleed: boolean;
  } {
    switch (useCase) {
      case 'home':
        return {
          dpi: 200,
          colorMode: 'rgb',
          paperSize: 'letter',
          margins: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
          includeBleed: false
        };

      case 'office':
        return {
          dpi: 300,
          colorMode: 'rgb',
          paperSize: 'letter',
          margins: { top: 0.4, right: 0.4, bottom: 0.4, left: 0.4 },
          includeBleed: false
        };

      case 'professional':
        return {
          dpi: 600,
          colorMode: 'cmyk',
          paperSize: 'letter',
          margins: { top: 0.25, right: 0.25, bottom: 0.25, left: 0.25 },
          includeBleed: true
        };

      case 'commercial':
        return {
          dpi: 600,
          colorMode: 'cmyk',
          paperSize: 'letter',
          margins: { top: 0.125, right: 0.125, bottom: 0.125, left: 0.125 },
          includeBleed: true
        };

      default:
        throw new Error(`Unknown use case: ${useCase}`);
    }
  }
}