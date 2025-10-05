import { ButtonArea as ButtonAreaModel, ButtonAreaData } from '@/models/ButtonArea';
import { ImageAsset, ImageAssetData } from '@/models/ImageAsset';

export interface ImageTransform {
  cropX: number;
  cropY: number;
  zoom: number;
  rotation: number;
}

export interface ButtonAreaComponent {
  // Properties
  id: string;
  element: HTMLElement;

  // State Management
  setData(buttonArea: ButtonAreaData): void;
  getData(): ButtonAreaData;
  setImageAsset(imageAsset: ImageAssetData | null): void;
  getImageAsset(): ImageAssetData | null;

  // Visual State
  setSelected(selected: boolean): void;
  setHovered(hovered: boolean): void;
  setDragging(dragging: boolean): void;

  // Image Operations
  updateImageDisplay(): void;
  applyImageTransform(transform: ImageTransform): void;

  // Event Handling
  onClick: (callback: (buttonArea: ButtonAreaComponent) => void) => void;
  onDoubleClick: (callback: (buttonArea: ButtonAreaComponent) => void) => void;
  onDragOver: (callback: (event: DragEvent) => void) => void;
  onDrop: (callback: (event: DragEvent, files: FileList) => void) => void;

  // Lifecycle
  destroy(): void;
}

export class ButtonAreaComponentImpl implements ButtonAreaComponent {
  public id: string;
  public element: HTMLElement;

  private buttonAreaModel: ButtonAreaModel;
  private imageAsset: ImageAsset | null = null;
  private isSelected: boolean = false;
  private isHovered: boolean = false;
  private isDragging: boolean = false;

  // Event callbacks
  private clickCallback: ((buttonArea: ButtonAreaComponent) => void) | null = null;
  private doubleClickCallback: ((buttonArea: ButtonAreaComponent) => void) | null = null;
  private dragOverCallback: ((event: DragEvent) => void) | null = null;
  private dropCallback: ((event: DragEvent, files: FileList) => void) | null = null;

  constructor(buttonAreaData: ButtonAreaData, container: HTMLElement) {
    this.buttonAreaModel = ButtonAreaModel.fromData(buttonAreaData);
    this.id = this.buttonAreaModel.id;

    this.element = this.createElement();
    this.setupEventListeners();
    this.updatePosition();
    this.updateImageDisplay();

    container.appendChild(this.element);
  }

  private createElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'button-area-component';
    element.setAttribute('data-testid', `button-area-${this.id}`);
    element.setAttribute('data-button-id', this.id);

    this.applyBaseStyles(element);
    return element;
  }

  private applyBaseStyles(element: HTMLElement): void {
    element.style.cssText = `
      position: absolute;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s ease;
      overflow: hidden;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    this.updateVisualState();
  }

  private setupEventListeners(): void {
    // Click handling
    this.element.addEventListener('click', this.handleClick.bind(this));
    this.element.addEventListener('dblclick', this.handleDoubleClick.bind(this));

    // Hover handling
    this.element.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

    // Drag and drop handling
    this.element.addEventListener('dragover', this.handleDragOver.bind(this));
    this.element.addEventListener('dragenter', this.handleDragEnter.bind(this));
    this.element.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.element.addEventListener('drop', this.handleDrop.bind(this));
  }

  private handleClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.clickCallback) {
      this.clickCallback(this);
    }
  }

  private handleDoubleClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.doubleClickCallback) {
      this.doubleClickCallback(this);
    }
  }

  private handleMouseEnter(): void {
    if (!this.isDragging) {
      this.setHovered(true);
    }
  }

  private handleMouseLeave(): void {
    if (!this.isDragging) {
      this.setHovered(false);
    }
  }

  private handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'copy';

    if (this.dragOverCallback) {
      this.dragOverCallback(event);
    }
  }

  private handleDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.setDragging(true);
  }

  private handleDragLeave(event: DragEvent): void {
    event.preventDefault();
    // Only set dragging to false if we're actually leaving the element
    if (!this.element.contains(event.relatedTarget as Node)) {
      this.setDragging(false);
    }
  }

  private handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.setDragging(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      if (this.dropCallback) {
        this.dropCallback(event, event.dataTransfer.files);
      }
    }
  }

  // State Management
  setData(buttonArea: ButtonAreaData): void {
    this.buttonAreaModel = ButtonAreaModel.fromData(buttonArea);
    this.updatePosition();
    this.updateImageDisplay();
  }

  getData(): ButtonAreaData {
    return this.buttonAreaModel.toData();
  }

  setImageAsset(imageAsset: ImageAssetData | null): void {
    this.imageAsset = imageAsset ? ImageAsset.fromData(imageAsset) : null;

    if (this.imageAsset) {
      this.buttonAreaModel.setImage(this.imageAsset.id);
    } else {
      this.buttonAreaModel.removeImage();
    }

    this.updateImageDisplay();
  }

  getImageAsset(): ImageAssetData | null {
    return this.imageAsset?.toData() || null;
  }

  // Visual State
  setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.updateVisualState();
  }

  setHovered(hovered: boolean): void {
    this.isHovered = hovered;
    this.updateVisualState();
  }

  setDragging(dragging: boolean): void {
    this.isDragging = dragging;
    this.updateVisualState();
  }

  private updateVisualState(): void {
    let borderColor = '#ccc';
    let backgroundColor = '#f8f8f8';
    let transform = 'scale(1)';
    let boxShadow = 'none';

    if (this.isDragging) {
      borderColor = '#007bff';
      backgroundColor = '#e3f2fd';
      transform = 'scale(1.02)';
      boxShadow = '0 2px 8px rgba(0,123,255,0.3)';
    } else if (this.isSelected) {
      borderColor = '#007bff';
      boxShadow = '0 0 0 2px rgba(0,123,255,0.25)';
    } else if (this.isHovered) {
      borderColor = '#666';
      transform = 'scale(1.02)';
      boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    }

    // Only apply background if no image
    if (!this.imageAsset) {
      this.element.style.backgroundColor = backgroundColor;
    } else {
      this.element.style.backgroundColor = 'transparent';
    }

    this.element.style.borderColor = borderColor;
    this.element.style.transform = transform;
    this.element.style.boxShadow = boxShadow;
  }

  private updatePosition(): void {
    const diameterPx = this.inchesToPixels(this.buttonAreaModel.diameter);
    const xPx = this.inchesToPixels(this.buttonAreaModel.x) - (diameterPx / 2);
    const yPx = this.inchesToPixels(this.buttonAreaModel.y) - (diameterPx / 2);

    this.element.style.left = `${xPx}px`;
    this.element.style.top = `${yPx}px`;
    this.element.style.width = `${diameterPx}px`;
    this.element.style.height = `${diameterPx}px`;
    this.element.style.border = `2px solid #ccc`;
  }

  private inchesToPixels(inches: number): number {
    return inches * 80; // 80 DPI for screen display
  }

  // Image Operations
  updateImageDisplay(): void {
    // Clear existing content
    this.element.innerHTML = '';

    if (this.imageAsset) {
      this.renderImageContent();
    } else {
      this.renderPlaceholderContent();
    }

    this.updateVisualState();
  }

  private renderImageContent(): void {
    if (!this.imageAsset) return;

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
      width: ${100 * this.buttonAreaModel.zoom}%;
      height: ${100 * this.buttonAreaModel.zoom}%;
      object-fit: cover;
      left: ${50 - (this.buttonAreaModel.cropX * 100 * this.buttonAreaModel.zoom)}%;
      top: ${50 - (this.buttonAreaModel.cropY * 100 * this.buttonAreaModel.zoom)}%;
      transform: translate(-50%, -50%) rotate(${this.buttonAreaModel.rotation}deg);
      pointer-events: none;
    `;

    img.src = this.imageAsset.dataUrl;
    img.alt = this.imageAsset.filename;

    img.onload = () => {
      // Ensure image is properly positioned after load
      this.applyImageTransform({
        cropX: this.buttonAreaModel.cropX,
        cropY: this.buttonAreaModel.cropY,
        zoom: this.buttonAreaModel.zoom,
        rotation: this.buttonAreaModel.rotation
      });
    };

    imageContainer.appendChild(img);
    this.element.appendChild(imageContainer);

    // Add image info overlay for debugging (hidden by default)
    if (process.env.NODE_ENV === 'development') {
      this.addImageDebugOverlay();
    }
  }

  private renderPlaceholderContent(): void {
    const placeholder = document.createElement('div');
    placeholder.style.cssText = `
      color: #999;
      font-size: 12px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      pointer-events: none;
      line-height: 1.2;
      padding: 8px;
      max-width: 80%;
    `;

    if (this.isDragging) {
      placeholder.innerHTML = `
        <div style="font-size: 16px; margin-bottom: 4px;">📷</div>
        <div>Drop image</div>
      `;
    } else {
      placeholder.innerHTML = `
        <div style="font-size: 14px; margin-bottom: 4px;">+</div>
        <div>Add image</div>
      `;
    }

    this.element.appendChild(placeholder);
  }

  private addImageDebugOverlay(): void {
    const debugOverlay = document.createElement('div');
    debugOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      background: rgba(0,0,0,0.7);
      color: white;
      font-size: 8px;
      padding: 2px 4px;
      border-radius: 0 0 4px 0;
      pointer-events: none;
      font-family: monospace;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;

    debugOverlay.textContent = `${this.buttonAreaModel.zoom.toFixed(1)}x R${this.buttonAreaModel.rotation}°`;

    this.element.addEventListener('mouseenter', () => {
      debugOverlay.style.opacity = '1';
    });

    this.element.addEventListener('mouseleave', () => {
      debugOverlay.style.opacity = '0';
    });

    this.element.appendChild(debugOverlay);
  }

  applyImageTransform(transform: ImageTransform): void {
    // Update model data
    this.buttonAreaModel.update({
      cropX: transform.cropX,
      cropY: transform.cropY,
      zoom: transform.zoom,
      rotation: transform.rotation
    });

    // Find and update image element
    const img = this.element.querySelector('img');
    if (img) {
      img.style.cssText = `
        position: absolute;
        width: ${100 * transform.zoom}%;
        height: ${100 * transform.zoom}%;
        object-fit: cover;
        left: ${50 - (transform.cropX * 100 * transform.zoom)}%;
        top: ${50 - (transform.cropY * 100 * transform.zoom)}%;
        transform: translate(-50%, -50%) rotate(${transform.rotation}deg);
        pointer-events: none;
      `;
    }

    // Update debug overlay if present
    const debugOverlay = this.element.querySelector('div[style*="rgba(0,0,0,0.7)"]') as HTMLElement;
    if (debugOverlay) {
      debugOverlay.textContent = `${transform.zoom.toFixed(1)}x R${transform.rotation}°`;
    }
  }

  // Event Handling
  onClick = (callback: (buttonArea: ButtonAreaComponent) => void): void => {
    this.clickCallback = callback;
  };

  onDoubleClick = (callback: (buttonArea: ButtonAreaComponent) => void): void => {
    this.doubleClickCallback = callback;
  };

  onDragOver = (callback: (event: DragEvent) => void): void => {
    this.dragOverCallback = callback;
  };

  onDrop = (callback: (event: DragEvent, files: FileList) => void): void => {
    this.dropCallback = callback;
  };

  // Lifecycle
  destroy(): void {
    // Remove event listeners
    this.element.removeEventListener('click', this.handleClick.bind(this));
    this.element.removeEventListener('dblclick', this.handleDoubleClick.bind(this));
    this.element.removeEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.element.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
    this.element.removeEventListener('dragover', this.handleDragOver.bind(this));
    this.element.removeEventListener('dragenter', this.handleDragEnter.bind(this));
    this.element.removeEventListener('dragleave', this.handleDragLeave.bind(this));
    this.element.removeEventListener('drop', this.handleDrop.bind(this));

    // Remove from DOM if present
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    // Clear references
    this.clickCallback = null;
    this.doubleClickCallback = null;
    this.dragOverCallback = null;
    this.dropCallback = null;
    this.imageAsset = null;
  }

  // Utility methods for external access
  getPixelDiameter(): number {
    return this.inchesToPixels(this.buttonAreaModel.diameter);
  }

  getPixelPosition(): { x: number; y: number } {
    const diameterPx = this.getPixelDiameter();
    return {
      x: this.inchesToPixels(this.buttonAreaModel.x) - (diameterPx / 2),
      y: this.inchesToPixels(this.buttonAreaModel.y) - (diameterPx / 2)
    };
  }

  getBoundingRect(): { left: number; top: number; right: number; bottom: number } {
    const pos = this.getPixelPosition();
    const diameter = this.getPixelDiameter();

    return {
      left: pos.x,
      top: pos.y,
      right: pos.x + diameter,
      bottom: pos.y + diameter
    };
  }

  isPointInside(x: number, y: number): boolean {
    const centerX = this.inchesToPixels(this.buttonAreaModel.x);
    const centerY = this.inchesToPixels(this.buttonAreaModel.y);
    const radius = this.getPixelDiameter() / 2;

    const distance = Math.sqrt(
      Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
    );

    return distance <= radius;
  }
}