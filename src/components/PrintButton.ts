import { PrintConfiguration, PrintConfigurationData } from '@/models/PrintConfiguration';

export interface PrintButtonComponent {
  // Lifecycle
  initialize(container: HTMLElement): void;

  // State Management
  setEnabled(enabled: boolean): void;
  setLoading(loading: boolean): void;

  // Event Handling
  onClick: (callback: () => void) => void;

  // Print Operations
  triggerPrint(sessionId: string, config?: Partial<PrintConfigurationData>): Promise<void>;
}

export class PrintButtonComponentImpl implements PrintButtonComponent {
  private element: HTMLButtonElement | null = null;
  private container: HTMLElement | null = null;
  private isEnabled: boolean = true;
  private isLoading: boolean = false;

  // Event callback
  private clickCallback: (() => void) | null = null;

  initialize(container: HTMLElement): void {
    this.container = container;
    this.createElement();
    this.setupEventListeners();
  }

  private createElement(): void {
    if (!this.container) throw new Error('Container not initialized');

    this.element = document.createElement('button');
    this.element.className = 'print-button';
    this.element.setAttribute('data-testid', 'print-button');
    this.element.type = 'button';

    this.applyStyles();
    this.updateContent();

    this.container.appendChild(this.element);
  }

  private applyStyles(): void {
    if (!this.element) return;

    this.element.style.cssText = `
      background: linear-gradient(135deg, #28a745, #20c997);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 16px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(40, 167, 69, 0.2);
      min-width: 120px;
      justify-content: center;
    `;

    this.updateVisualState();
  }

  private updateContent(): void {
    if (!this.element) return;

    if (this.isLoading) {
      this.element.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="animation: spin 1s linear infinite;">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-opacity="0.3"/>
          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
        </svg>
        <span>Printing...</span>
      `;
    } else {
      this.element.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
        </svg>
        <span>Print</span>
      `;
    }

    // Add CSS for spin animation
    if (this.isLoading && !document.querySelector('#print-button-styles')) {
      const style = document.createElement('style');
      style.id = 'print-button-styles';
      style.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  private updateVisualState(): void {
    if (!this.element) return;

    if (!this.isEnabled || this.isLoading) {
      this.element.style.background = '#6c757d';
      this.element.style.cursor = 'not-allowed';
      this.element.style.opacity = '0.6';
      this.element.style.boxShadow = 'none';
      this.element.disabled = true;
    } else {
      this.element.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
      this.element.style.cursor = 'pointer';
      this.element.style.opacity = '1';
      this.element.style.boxShadow = '0 2px 4px rgba(40, 167, 69, 0.2)';
      this.element.disabled = false;
    }
  }

  private setupEventListeners(): void {
    if (!this.element) return;

    this.element.addEventListener('click', this.handleClick.bind(this));

    // Hover effects
    this.element.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

    // Active state
    this.element.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.element.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  private handleClick(event: MouseEvent): void {
    event.preventDefault();

    if (!this.isEnabled || this.isLoading) {
      return;
    }

    if (this.clickCallback) {
      this.clickCallback();
    }
  }

  private handleMouseEnter(): void {
    if (!this.element || !this.isEnabled || this.isLoading) return;

    this.element.style.transform = 'translateY(-1px)';
    this.element.style.boxShadow = '0 4px 8px rgba(40, 167, 69, 0.3)';
  }

  private handleMouseLeave(): void {
    if (!this.element || !this.isEnabled || this.isLoading) return;

    this.element.style.transform = 'translateY(0)';
    this.element.style.boxShadow = '0 2px 4px rgba(40, 167, 69, 0.2)';
  }

  private handleMouseDown(): void {
    if (!this.element || !this.isEnabled || this.isLoading) return;

    this.element.style.transform = 'translateY(0) scale(0.98)';
  }

  private handleMouseUp(): void {
    if (!this.element || !this.isEnabled || this.isLoading) return;

    this.element.style.transform = 'translateY(-1px) scale(1)';
  }

  // Public interface methods
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.updateVisualState();
  }

  setLoading(loading: boolean): void {
    this.isLoading = loading;
    this.updateContent();
    this.updateVisualState();
  }

  onClick = (callback: () => void): void => {
    this.clickCallback = callback;
  };

  async triggerPrint(sessionId: string, config?: Partial<PrintConfigurationData>): Promise<void> {
    try {
      this.setLoading(true);

      // Create print configuration
      const printConfig = config ?
        Object.assign(PrintConfiguration.createDefault(sessionId), config) :
        PrintConfiguration.createDefault(sessionId);

      // Apply print styles immediately
      const printStyles = this.generatePrintStyles(printConfig);

      // Remove any existing print styles
      const existingStyles = document.querySelector('#print-styles');
      if (existingStyles) {
        existingStyles.remove();
      }

      const styleElement = document.createElement('style');
      styleElement.id = 'print-styles';
      styleElement.textContent = printStyles;
      document.head.appendChild(styleElement);

      // Hide non-print elements immediately
      this.hideNonPrintElements();

      // Force a reflow to ensure styles are applied
      document.body.offsetHeight;

      // Add a small delay to ensure DOM changes are processed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Trigger browser print
      window.print();

      // Restore elements after print (with longer delay to ensure print dialog closes)
      setTimeout(() => {
        this.restoreNonPrintElements();
        if (styleElement.parentNode) {
          styleElement.parentNode.removeChild(styleElement);
        }
      }, 2000);

    } catch (error) {
      console.error('Print failed:', error);
      this.showPrintError(error instanceof Error ? error.message : 'Unknown print error');
    } finally {
      // Set loading to false after a delay to ensure print dialog has time to open
      setTimeout(() => {
        this.setLoading(false);
      }, 500);
    }
  }

  private generatePrintStyles(config: PrintConfiguration): string {
    const paperDimensions = config.getPaperDimensions();
    const margins = config.margins;

    return `
      @media print {
        /* Override page settings if different from default */
        @page {
          size: ${paperDimensions.width}in ${paperDimensions.height}in;
          margin: ${margins.top}in ${margins.right}in ${margins.bottom}in ${margins.left}in;
        }

        /* Ensure all elements that should be hidden are hidden */
        .print-button,
        .config-modal-overlay,
        .app-header,
        .toolbar,
        .status-bar,
        .no-print {
          display: none !important;
        }

        /* Force print layout */
        body {
          margin: 0 !important;
          padding: 0 !important;
        }

        .main-content {
          display: block !important;
        }

        .canvas-wrapper {
          display: block !important;
        }

        .pin-canvas {
          display: block !important;
          position: relative !important;
        }

        /* Ensure button areas and images are visible */
        .button-area {
          display: block !important;
          position: absolute !important;
        }

        .button-area img {
          display: block !important;
        }
      }
    `;
  }

  private hideNonPrintElements(): void {
    // Add no-print class to elements that shouldn't be printed
    const elementsToHide = [
      '.print-button',
      '[data-testid="config-modal"]',
      '.toolbar',
      '.sidebar',
      'nav',
      'header:not(.print-header)',
      'footer:not(.print-footer)'
    ];

    elementsToHide.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.classList.add('no-print');
      });
    });
  }

  private restoreNonPrintElements(): void {
    // Remove no-print class after printing
    const elements = document.querySelectorAll('.no-print');
    elements.forEach(element => {
      element.classList.remove('no-print');
    });
  }

  private showPrintError(message: string): void {
    // Create temporary error notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <div>
          <div style="font-weight: 600;">Print Error</div>
          <div style="font-size: 14px; opacity: 0.9;">${message}</div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);

    // Allow manual close
    notification.addEventListener('click', () => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    });
  }

  // Utility methods for external use
  showPrintDialog(): void {
    if (this.isEnabled && !this.isLoading && this.clickCallback) {
      this.clickCallback();
    }
  }

  isPrintAvailable(): boolean {
    return 'print' in window;
  }

  destroy(): void {
    // Remove event listeners
    if (this.element) {
      this.element.removeEventListener('click', this.handleClick.bind(this));
      this.element.removeEventListener('mouseenter', this.handleMouseEnter.bind(this));
      this.element.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
      this.element.removeEventListener('mousedown', this.handleMouseDown.bind(this));
      this.element.removeEventListener('mouseup', this.handleMouseUp.bind(this));

      // Remove from DOM
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
    }

    // Clean up styles
    const printStyles = document.querySelector('#print-button-styles');
    if (printStyles?.parentNode) {
      printStyles.parentNode.removeChild(printStyles);
    }

    // Clear references
    this.element = null;
    this.container = null;
    this.clickCallback = null;
  }
}