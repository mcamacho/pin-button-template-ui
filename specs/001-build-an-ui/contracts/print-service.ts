/**
 * Print Service Contract
 * Defines the interface for print operations and browser print integration
 */

export interface PrintService {
  // Print Operations
  printSession(sessionId: string, config?: Partial<PrintConfiguration>): Promise<PrintResult>;
  printPreview(sessionId: string, config?: Partial<PrintConfiguration>): Promise<string>; // Returns data URL
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

// Supporting types
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

// Re-export types from other contracts
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