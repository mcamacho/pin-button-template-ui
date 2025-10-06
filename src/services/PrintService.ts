import { ButtonArea } from '@/models/ButtonArea';
import { PrintConfiguration } from '@/models/PrintConfiguration';
import type { ImageService } from './ImageService';

export interface PrintResult {
  success: boolean;
  documentId?: string;
  error?: string;
  timestamp: Date;
}

export interface PrintDocument {
  id: string;
  sessionId: string;
  htmlContent: string;
  cssStyles: string;
  config: PrintConfiguration;
  createdAt: Date;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PrinterCapabilities {
  supportedSizes: string[];
  maxDpi: number;
  colorSupport: boolean;
  duplexSupport: boolean;
}

export interface PageSize {
  width: number; // inches
  height: number; // inches
  name: string; // 'letter', 'a4', etc.
}

export interface LayoutCalculation {
  maxButtonsPerRow: number;
  maxRows: number;
  totalButtons: number;
  buttonSpacing: {
    horizontal: number;
    vertical: number;
  };
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface FitValidation {
  allButtonsFit: boolean;
  overlappingButtons: string[]; // button area IDs
  buttonsOutOfBounds: string[]; // button area IDs
  suggestions: string[];
}

export interface PrintService {
  // Print Operations
  printSession(sessionId: string, config?: Partial<PrintConfiguration>): Promise<PrintResult>;
  printPreview(sessionId: string, config?: Partial<PrintConfiguration>): Promise<string>;
  generatePrintableDocument(sessionId: string, config: PrintConfiguration): Promise<PrintDocument>;

  // Print Configuration
  getDefaultPrintConfig(): PrintConfiguration;
  validatePrintConfig(config: Partial<PrintConfiguration>): ValidationResult;
  detectPrinterCapabilities(): Promise<PrinterCapabilities>;

  // Layout Calculation
  calculateButtonLayout(pageSize: PageSize, buttonDiameter: number, spacing: number): LayoutCalculation;
  optimizeButtonPlacement(buttonAreas: ButtonArea[], pageSize: PageSize): ButtonArea[];
  validatePageFit(buttonAreas: ButtonArea[], pageSize: PageSize): FitValidation;

  // Browser Print Integration
  openPrintDialog(printDocument: PrintDocument): Promise<boolean>;
  setupPrintStyles(config: PrintConfiguration): void;
  cleanupPrintStyles(): void;
}

export class PrintService implements PrintService {
  private currentPrintStyles: HTMLStyleElement | null = null;

  constructor(_imageService?: ImageService) {
    // ImageService not currently used, reserved for future use
  }

  async printSession(sessionId: string, config?: Partial<PrintConfiguration>): Promise<PrintResult> {
    try {
      const printConfig = config ?
        Object.assign(this.getDefaultPrintConfig(), config) :
        this.getDefaultPrintConfig();

      const document = await this.generatePrintableDocument(sessionId, printConfig);
      const success = await this.openPrintDialog(document);

      return {
        success,
        documentId: document.id,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown print error',
        timestamp: new Date()
      };
    }
  }

  async printPreview(sessionId: string, config?: Partial<PrintConfiguration>): Promise<string> {
    const printConfig = config ?
      Object.assign(this.getDefaultPrintConfig(), config) :
      this.getDefaultPrintConfig();

    const document = await this.generatePrintableDocument(sessionId, printConfig);

    // Create a temporary container to render the print document
    const container = window.document.createElement('div');
    container.innerHTML = document.htmlContent;

    // Apply print styles
    const style = window.document.createElement('style');
    style.textContent = document.cssStyles;
    container.appendChild(style);

    // Convert to canvas for preview
    // Note: In a real implementation, you might use html2canvas or similar
    const canvas = window.document.createElement('canvas');
    const paperDimensions = printConfig.getPaperDimensions();

    canvas.width = printConfig.inchesToPixels(paperDimensions.width);
    canvas.height = printConfig.inchesToPixels(paperDimensions.height);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to create preview canvas');
    }

    // Fill with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add a placeholder preview representation
    ctx.fillStyle = '#f0f0f0';
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 2;

    const printableArea = printConfig.getPrintableArea();
    const marginLeft = printConfig.inchesToPixels(printConfig.margins.left);
    const marginTop = printConfig.inchesToPixels(printConfig.margins.top);
    const areaWidth = printConfig.inchesToPixels(printableArea.width);
    const areaHeight = printConfig.inchesToPixels(printableArea.height);

    ctx.fillRect(marginLeft, marginTop, areaWidth, areaHeight);
    ctx.strokeRect(marginLeft, marginTop, areaWidth, areaHeight);

    return canvas.toDataURL('image/png');
  }

  async generatePrintableDocument(sessionId: string, config: PrintConfiguration): Promise<PrintDocument> {
    const documentId = `print-doc-${crypto.randomUUID()}`;

    // Generate CSS styles for print
    const cssStyles = this.generatePrintCSS(config);

    // Generate HTML content structure
    const htmlContent = this.generatePrintHTML(sessionId, config);

    return {
      id: documentId,
      sessionId,
      htmlContent,
      cssStyles,
      config,
      createdAt: new Date()
    };
  }

  private generatePrintCSS(config: PrintConfiguration): string {
    const paperSize = config.getPaperDimensions();
    const margins = config.margins;

    return `
      @media print {
        @page {
          size: ${paperSize.width}in ${paperSize.height}in;
          margin: ${margins.top}in ${margins.right}in ${margins.bottom}in ${margins.left}in;
        }

        body {
          margin: 0;
          padding: 0;
          background: white;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .print-container {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .button-area {
          position: absolute;
          border-radius: 50%;
          overflow: hidden;
          ${config.includeBleed ? `box-shadow: 0 0 0 ${config.bleedSize}in rgba(0,0,0,0.1);` : ''}
        }

        .button-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Hide non-print elements */
        .no-print {
          display: none !important;
        }
      }

      @media screen {
        .print-preview {
          width: ${paperSize.width}in;
          height: ${paperSize.height}in;
          margin: 20px auto;
          background: white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          position: relative;
        }
      }
    `;
  }

  private generatePrintHTML(_sessionId: string, _config: PrintConfiguration): string {
    // This would typically fetch session data and button areas
    // For now, return a template structure
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Pin Button Layout - Session ${_sessionId}</title>
        </head>
        <body>
          <div class="print-container">
            <div id="button-areas-container">
              <!-- Button areas will be dynamically inserted here -->
            </div>
          </div>
        </body>
      </html>
    `;
  }

  getDefaultPrintConfig(): PrintConfiguration {
    return PrintConfiguration.createDefault('default-session');
  }

  validatePrintConfig(config: Partial<PrintConfiguration>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.dpi !== undefined) {
      if (config.dpi < 150 || config.dpi > 600) {
        errors.push('DPI must be between 150 and 600');
      }
      if (config.dpi < 200) {
        warnings.push('DPI below 200 may result in poor print quality');
      }
    }

    if (config.margins) {
      Object.entries(config.margins).forEach(([side, margin]) => {
        if (margin < 0 || margin > 2.0) {
          errors.push(`${side} margin must be between 0 and 2.0 inches`);
        }
      });
    }

    if (config.bleedSize !== undefined) {
      if (config.bleedSize < 0 || config.bleedSize > 0.25) {
        errors.push('Bleed size must be between 0 and 0.25 inches');
      }
    }

    if (config.paperSize && !['letter', 'a4', 'custom'].includes(config.paperSize)) {
      errors.push('Invalid paper size. Supported: letter, a4, custom');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async detectPrinterCapabilities(): Promise<PrinterCapabilities> {
    // In a real browser environment, this would query available printers
    // For now, return typical capabilities
    return {
      supportedSizes: ['letter', 'a4', 'legal'],
      maxDpi: 600,
      colorSupport: true,
      duplexSupport: true
    };
  }

  calculateButtonLayout(pageSize: PageSize, buttonDiameter: number, spacing: number): LayoutCalculation {
    // Calculate usable area (page minus minimal margins)
    const usableWidth = pageSize.width - (spacing * 2);
    const usableHeight = pageSize.height - (spacing * 2);

    const buttonWithSpacing = buttonDiameter + spacing;

    // Calculate how many buttons fit
    const maxButtonsPerRow = Math.floor(usableWidth / buttonWithSpacing);
    const maxRows = Math.floor(usableHeight / buttonWithSpacing);
    const totalButtons = maxButtonsPerRow * maxRows;

    // Calculate actual spacing to center buttons
    const actualHorizontalSpacing = (usableWidth - (maxButtonsPerRow * buttonDiameter)) / (maxButtonsPerRow + 1);
    const actualVerticalSpacing = (usableHeight - (maxRows * buttonDiameter)) / (maxRows + 1);

    return {
      maxButtonsPerRow,
      maxRows,
      totalButtons,
      buttonSpacing: {
        horizontal: actualHorizontalSpacing,
        vertical: actualVerticalSpacing
      },
      margins: {
        top: spacing,
        right: spacing,
        bottom: spacing,
        left: spacing
      }
    };
  }

  optimizeButtonPlacement(buttonAreas: ButtonArea[], pageSize: PageSize): ButtonArea[] {
    const optimized = buttonAreas.map(ba => ButtonArea.fromData(ba.toData()));

    // Get optimal layout for standard button size
    const layout = this.calculateButtonLayout(pageSize, 2.75, 0.25);

    let buttonIndex = 0;
    const startX = layout.buttonSpacing.horizontal + (2.75 / 2);
    const startY = layout.buttonSpacing.vertical + (2.75 / 2);

    for (let row = 0; row < layout.maxRows && buttonIndex < optimized.length; row++) {
      for (let col = 0; col < layout.maxButtonsPerRow && buttonIndex < optimized.length; col++) {
        const button = optimized[buttonIndex];

        const x = startX + (col * (2.75 + layout.buttonSpacing.horizontal));
        const y = startY + (row * (2.75 + layout.buttonSpacing.vertical));

        button.update({ x, y });
        buttonIndex++;
      }
    }

    return optimized;
  }

  validatePageFit(buttonAreas: ButtonArea[], pageSize: PageSize): FitValidation {
    const buttonsOutOfBounds: string[] = [];
    const overlappingButtons: string[] = [];
    const suggestions: string[] = [];

    // Check bounds
    buttonAreas.forEach(button => {
      if (!button.fitsInPage(pageSize.width, pageSize.height)) {
        buttonsOutOfBounds.push(button.id);
      }
    });

    // Check overlaps
    for (let i = 0; i < buttonAreas.length; i++) {
      for (let j = i + 1; j < buttonAreas.length; j++) {
        if (buttonAreas[i].overlaps(buttonAreas[j])) {
          if (!overlappingButtons.includes(buttonAreas[i].id)) {
            overlappingButtons.push(buttonAreas[i].id);
          }
          if (!overlappingButtons.includes(buttonAreas[j].id)) {
            overlappingButtons.push(buttonAreas[j].id);
          }
        }
      }
    }

    // Generate suggestions
    if (buttonsOutOfBounds.length > 0) {
      suggestions.push('Some buttons extend beyond page boundaries. Consider reducing button size or repositioning.');
    }

    if (overlappingButtons.length > 0) {
      suggestions.push('Some buttons overlap. Use auto-arrange to optimize layout.');
    }

    const layout = this.calculateButtonLayout(pageSize, 2.75, 0.25);
    if (buttonAreas.length > layout.totalButtons) {
      suggestions.push(`Page can optimally fit ${layout.totalButtons} buttons at 2.75" diameter. Consider reducing button count or size.`);
    }

    return {
      allButtonsFit: buttonsOutOfBounds.length === 0 && overlappingButtons.length === 0,
      buttonsOutOfBounds,
      overlappingButtons,
      suggestions
    };
  }

  async openPrintDialog(printDocument: PrintDocument): Promise<boolean> {
    try {
      // Setup print styles
      this.setupPrintStyles(printDocument.config);

      // Create a hidden iframe or window for printing
      const printFrame = document.createElement('iframe');
      printFrame.style.display = 'none';
      document.body.appendChild(printFrame);

      if (!printFrame.contentDocument) {
        throw new Error('Failed to access print frame document');
      }

      // Write content to frame
      printFrame.contentDocument.open();
      printFrame.contentDocument.write(`
        <html>
          <head>
            <style>${printDocument.cssStyles}</style>
          </head>
          <body>${printDocument.htmlContent}</body>
        </html>
      `);
      printFrame.contentDocument.close();

      // Wait for content to load, then print
      await new Promise(resolve => {
        if (printFrame.contentWindow) {
          printFrame.contentWindow.onload = resolve;
        }
      });

      if (printFrame.contentWindow) {
        printFrame.contentWindow.print();
      }

      // Cleanup after a delay
      setTimeout(() => {
        document.body.removeChild(printFrame);
        this.cleanupPrintStyles();
      }, 1000);

      return true;
    } catch (error) {
      console.error('Print dialog failed:', error);
      this.cleanupPrintStyles();
      return false;
    }
  }

  setupPrintStyles(_config: PrintConfiguration): void {
    // Remove existing print styles
    this.cleanupPrintStyles();

    // Create new print style element
    this.currentPrintStyles = document.createElement('style');
    this.currentPrintStyles.setAttribute('data-print-styles', 'true');
    this.currentPrintStyles.textContent = this.generatePrintCSS(_config);

    document.head.appendChild(this.currentPrintStyles);
  }

  cleanupPrintStyles(): void {
    if (this.currentPrintStyles) {
      document.head.removeChild(this.currentPrintStyles);
      this.currentPrintStyles = null;
    }

    // Also remove any other print styles that might exist
    const existingStyles = document.querySelectorAll('style[data-print-styles]');
    existingStyles.forEach(style => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    });
  }
}