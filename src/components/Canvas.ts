import { Session, SessionData } from '@/models/Session';
import { ButtonArea, ButtonAreaData } from '@/models/ButtonArea';
import { ImageAsset } from '@/models/ImageAsset';
import { LayoutCalculator } from '@/utils/layout';

export interface ICanvasComponent {
  // Lifecycle
  initialize(container: HTMLElement): Promise<void>;
  destroy(): void;

  // Session Management
  loadSession(session: SessionData): Promise<void>;
  getCurrentSession(): SessionData | null;

  // Button Area Management
  addButtonArea(x: number, y: number): Promise<ButtonAreaData>;
  removeButtonArea(id: string): Promise<boolean>;
  getButtonArea(id: string): ButtonAreaData | null;
  getAllButtonAreas(): ButtonAreaData[];

  // Event Handling
  onButtonAreaClick: (callback: (buttonArea: ButtonAreaData) => void) => void;
  onImageDrop: (callback: (files: FileList, buttonAreaId: string | null) => void) => void;
  onLayoutChange: (callback: (session: SessionData) => void) => void;

  // Rendering
  render(): void;
  redraw(): void;
  setZoom(level: number): void;
}

export class CanvasComponent implements ICanvasComponent {
  private container: HTMLElement | null = null;
  private canvasElement: HTMLDivElement | null = null;
  private currentSession: Session | null = null;
  private buttonAreaElements: Map<string, HTMLElement> = new Map();
  private zoomLevel: number = 1.0;

  // Event callbacks
  private buttonAreaClickCallback: ((buttonArea: ButtonAreaData) => void) | null = null;
  private imageDropCallback: ((files: FileList, buttonAreaId: string | null) => void) | null = null;
  private layoutChangeCallback: ((session: SessionData) => void) | null = null;

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container;
    this.setupCanvas();
    this.setupEventListeners();

    // Don't create session here - will be created by main app
  }

  destroy(): void {
    this.removeEventListeners();
    this.buttonAreaElements.clear();

    if (this.canvasElement && this.container) {
      this.container.removeChild(this.canvasElement);
    }

    this.canvasElement = null;
    this.container = null;
    this.currentSession = null;
  }

  private setupCanvas(): void {
    if (!this.container) throw new Error('Container not initialized');

    // Create main canvas element
    this.canvasElement = document.createElement('div');
    this.canvasElement.className = 'pin-canvas';
    this.canvasElement.setAttribute('data-testid', 'canvas-container');

    // Apply Letter page styling
    this.applyCanvasStyles();

    this.container.appendChild(this.canvasElement);
  }

  private applyCanvasStyles(): void {
    if (!this.canvasElement) return;

    const styles = `
      position: relative;
      width: 680px; /* 8.5" at 80 DPI for screen */
      height: 880px; /* 11" at 80 DPI for screen */
      background: white;
      border: 2px solid #ccc;
      margin: 20px auto;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      transform: scale(${this.zoomLevel});
      transform-origin: center;
    `;

    this.canvasElement.style.cssText = styles;
  }

  private setupEventListeners(): void {
    if (!this.canvasElement) return;

    // Drag and drop support
    this.canvasElement.addEventListener('dragover', this.handleDragOver.bind(this));
    this.canvasElement.addEventListener('drop', this.handleDrop.bind(this));

    // Click handling
    this.canvasElement.addEventListener('click', this.handleCanvasClick.bind(this));
  }

  private removeEventListeners(): void {
    if (!this.canvasElement) return;

    this.canvasElement.removeEventListener('dragover', this.handleDragOver.bind(this));
    this.canvasElement.removeEventListener('drop', this.handleDrop.bind(this));
    this.canvasElement.removeEventListener('click', this.handleCanvasClick.bind(this));
  }

  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault();

    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) {
      return;
    }

    const rect = this.canvasElement!.getBoundingClientRect();
    const x = (event.clientX - rect.left) / this.zoomLevel;
    const y = (event.clientY - rect.top) / this.zoomLevel;

    // Find button area at drop location
    const buttonAreaId = this.findButtonAreaAtPosition(x, y);

    if (this.imageDropCallback) {
      this.imageDropCallback(event.dataTransfer.files, buttonAreaId);
    }
  }

  private handleCanvasClick(event: MouseEvent): void {
    const rect = this.canvasElement!.getBoundingClientRect();
    const x = (event.clientX - rect.left) / this.zoomLevel;
    const y = (event.clientY - rect.top) / this.zoomLevel;

    const buttonAreaId = this.findButtonAreaAtPosition(x, y);

    if (buttonAreaId && this.buttonAreaClickCallback) {
      const buttonArea = this.getButtonArea(buttonAreaId);
      if (buttonArea) {
        this.buttonAreaClickCallback(buttonArea);
      }
    }
  }

  private findButtonAreaAtPosition(x: number, y: number): string | null {
    if (!this.currentSession) return null;

    const buttonAreas = this.currentSession.getButtonAreas();

    for (const buttonArea of buttonAreas) {
      const distance = Math.sqrt(
        Math.pow(x - this.inchesToPixels(buttonArea.x), 2) +
        Math.pow(y - this.inchesToPixels(buttonArea.y), 2)
      );

      const radius = this.inchesToPixels(buttonArea.diameter) / 2;

      if (distance <= radius) {
        return buttonArea.id;
      }
    }

    return null;
  }

  private inchesToPixels(inches: number): number {
    return inches * 80; // 80 DPI for screen display
  }

  private pixelsToInches(pixels: number): number {
    return pixels / 80;
  }

  private setupDefaultButtonAreas(): void {
    if (!this.currentSession) return;

    // Create simple, safe button positions manually
    const buttonDiameter = 2.75;

    // Calculate safe positions that will definitely fit
    const safePositions = [
      { x: 2.5, y: 2.5 }, // Top-left area
      { x: 6.0, y: 2.5 }, // Top-right area
      { x: 2.5, y: 5.5 }, // Middle-left
      { x: 6.0, y: 5.5 }, // Middle-right
      { x: 2.5, y: 8.5 }, // Bottom-left
      { x: 6.0, y: 8.5 }, // Bottom-right
    ];

    // Create button areas with validation
    safePositions.forEach(position => {
      try {
        const buttonArea = ButtonArea.createAt(
          this.currentSession!.id,
          position.x,
          position.y,
          buttonDiameter
        );

        this.currentSession!.addButtonArea(buttonArea);
      } catch (error) {
        console.error('Failed to create button area:', error);
      }
    });

    this.render();
  }

  // Session Management
  async loadSession(sessionData: SessionData): Promise<void> {
    this.currentSession = Session.fromData(sessionData);
    this.render();
  }

  getCurrentSession(): SessionData | null {
    return this.currentSession?.toData() || null;
  }

  // Button Area Management
  async addButtonArea(x: number, y: number): Promise<ButtonAreaData> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    const xInches = this.pixelsToInches(x);
    const yInches = this.pixelsToInches(y);

    const buttonArea = ButtonArea.createAt(this.currentSession.id, xInches, yInches);
    this.currentSession.addButtonArea(buttonArea);

    this.renderButtonArea(buttonArea);
    this.notifyLayoutChange();

    return buttonArea.toData();
  }

  async removeButtonArea(id: string): Promise<boolean> {
    if (!this.currentSession) return false;

    const removed = this.currentSession.removeButtonArea(id);

    if (removed) {
      // Remove from DOM
      const element = this.buttonAreaElements.get(id);
      if (element && this.canvasElement) {
        this.canvasElement.removeChild(element);
        this.buttonAreaElements.delete(id);
      }

      this.notifyLayoutChange();
    }

    return removed;
  }

  getButtonArea(id: string): ButtonAreaData | null {
    return this.currentSession?.getButtonArea(id)?.toData() || null;
  }

  getAllButtonAreas(): ButtonAreaData[] {
    return this.currentSession?.getButtonAreas().map(ba => ba.toData()) || [];
  }

  // Event Handling
  onButtonAreaClick = (callback: (buttonArea: ButtonAreaData) => void): void => {
    this.buttonAreaClickCallback = callback;
  };

  onImageDrop = (callback: (files: FileList, buttonAreaId: string | null) => void): void => {
    this.imageDropCallback = callback;
  };

  onLayoutChange = (callback: (session: SessionData) => void): void => {
    this.layoutChangeCallback = callback;
  };

  private notifyLayoutChange(): void {
    if (this.layoutChangeCallback && this.currentSession) {
      this.layoutChangeCallback(this.currentSession.toData());
    }
  }

  // Rendering
  render(): void {
    if (!this.canvasElement || !this.currentSession) return;

    // Clear existing button areas
    this.buttonAreaElements.forEach(element => {
      if (this.canvasElement!.contains(element)) {
        this.canvasElement!.removeChild(element);
      }
    });
    this.buttonAreaElements.clear();

    // Render all button areas
    const buttonAreas = this.currentSession.getButtonAreas();
    buttonAreas.forEach(buttonArea => {
      this.renderButtonArea(buttonArea);
    });
  }

  redraw(): void {
    this.render();
  }

  setZoom(level: number): void {
    this.zoomLevel = Math.max(0.1, Math.min(3.0, level));
    this.applyCanvasStyles();
  }

  private renderButtonArea(buttonArea: ButtonArea): void {
    if (!this.canvasElement) return;

    const element = document.createElement('div');
    element.className = 'button-area';
    element.setAttribute('data-testid', `button-area-${buttonArea.id}`);
    element.setAttribute('data-button-id', buttonArea.id);

    const diameterPx = this.inchesToPixels(buttonArea.diameter);
    const xPx = this.inchesToPixels(buttonArea.x) - (diameterPx / 2);
    const yPx = this.inchesToPixels(buttonArea.y) - (diameterPx / 2);

    element.style.cssText = `
      position: absolute;
      left: ${xPx}px;
      top: ${yPx}px;
      width: ${diameterPx}px;
      height: ${diameterPx}px;
      border-radius: 50%;
      border: 2px dashed #999;
      background: #f8f8f8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      overflow: hidden;
    `;

    // Add hover effects
    element.addEventListener('mouseenter', () => {
      element.style.borderColor = '#666';
      element.style.transform = 'scale(1.05)';
    });

    element.addEventListener('mouseleave', () => {
      element.style.borderColor = '#999';
      element.style.transform = 'scale(1)';
    });

    // Add drag-over effects
    element.addEventListener('dragenter', (e) => {
      e.preventDefault();
      element.classList.add('drag-over');
      element.style.borderColor = '#007bff';
      element.style.backgroundColor = '#e3f2fd';
    });

    element.addEventListener('dragleave', (e) => {
      e.preventDefault();
      element.classList.remove('drag-over');
      element.style.borderColor = '#999';
      element.style.backgroundColor = '#f8f8f8';
    });

    // Add placeholder text if no image
    if (!buttonArea.imageAssetId) {
      const placeholder = document.createElement('div');
      placeholder.style.cssText = `
        color: #999;
        font-size: 14px;
        text-align: center;
        font-family: Arial, sans-serif;
        pointer-events: none;
      `;
      placeholder.textContent = 'Drop image here';
      element.appendChild(placeholder);
    }

    this.canvasElement.appendChild(element);
    this.buttonAreaElements.set(buttonArea.id, element);

    // Check if this button area has an associated image and display it
    if (buttonArea.imageAssetId) {
      this.loadAndDisplayButtonImage(buttonArea.id, element);
    }
  }

  private async loadAndDisplayButtonImage(buttonAreaId: string, element: HTMLElement): Promise<void> {
    const buttonArea = this.currentSession?.getButtonArea(buttonAreaId);
    if (!buttonArea?.imageAssetId) return;

    try {
      // Get the main app instance to access loaded images
      const app = (window as any).pinButtonApp as PinButtonApp;
      if (app) {
        const imageAsset = (app as any).loadedImageAssets.get(buttonArea.imageAssetId);
        if (imageAsset) {
          this.displayImageInButtonElement(element, imageAsset, buttonArea);
        }
      }
    } catch (error) {
      console.error('Failed to load image for button area:', error);
    }
  }

  private displayImageInButtonElement(element: HTMLElement, imageAsset: any, buttonArea: any): void {
    // Clear existing content
    element.innerHTML = '';

    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
      border-radius: 50%;
    `;

    const img = document.createElement('img');
    img.style.cssText = `
      position: absolute;
      width: ${100 * buttonArea.zoom}%;
      height: ${100 * buttonArea.zoom}%;
      object-fit: cover;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%)
                 translate(${(0.5 - buttonArea.cropX) * 100}%, ${(0.5 - buttonArea.cropY) * 100}%)
                 rotate(${buttonArea.rotation}deg);
      pointer-events: none;
    `;

    img.src = imageAsset.dataUrl;
    img.alt = imageAsset.filename;

    imageContainer.appendChild(img);
    element.appendChild(imageContainer);
    element.style.backgroundColor = 'transparent';
    element.style.border = '2px solid #007bff';
  }

  // Utility methods for external use
  updateButtonAreaImage(buttonAreaId: string, imageAsset: ImageAsset): void {
    const buttonArea = this.currentSession?.getButtonArea(buttonAreaId);
    const element = this.buttonAreaElements.get(buttonAreaId);

    if (!buttonArea || !element) return;

    buttonArea.setImage(imageAsset.id);

    // Clear existing content
    element.innerHTML = '';

    // Create image element
    const img = document.createElement('img');
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
      pointer-events: none;
    `;
    img.src = imageAsset.thumbnailUrl;
    img.alt = imageAsset.filename;

    element.appendChild(img);
    element.style.backgroundColor = 'transparent';
    element.style.border = '2px solid #007bff';

    this.notifyLayoutChange();
  }

  autoArrangeButtons(): void {
    if (!this.currentSession) return;

    const pageSize = { width: 8.5, height: 11.0 };
    this.currentSession.autoArrangeButtons();
    this.render();
    this.notifyLayoutChange();
  }

  clearAllButtons(): void {
    if (!this.currentSession) return;

    this.currentSession.clearButtonAreas();
    this.render();
    this.notifyLayoutChange();
  }
}