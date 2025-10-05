import { ButtonAreaData } from '@/models/ButtonArea';
import { ImageAssetData } from '@/models/ImageAsset';
import { ModelValidator } from '@/utils/validation';

export interface ModalFormData {
  diameter: number;
  imageFile?: File;
  cropX: number;
  cropY: number;
  zoom: number;
  rotation: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface IModalComponent {
  // Lifecycle
  show(buttonAreaId: string): Promise<void>;
  hide(): Promise<void>;
  isVisible(): boolean;

  // Data Binding
  loadButtonAreaData(buttonArea: ButtonAreaData, imageAsset?: ImageAssetData): void;
  getFormData(): ModalFormData;
  resetForm(): void;

  // Image Handling
  uploadImage(): Promise<File | null>;
  removeImage(): Promise<boolean>;

  // Event Handling
  onSave: (callback: (formData: ModalFormData) => void) => void;
  onCancel: (callback: () => void) => void;
  onImageChange: (callback: (file: File | null) => void) => void;

  // Validation
  validateForm(): ValidationResult;
}

export class ModalComponent implements IModalComponent {
  private element: HTMLElement | null = null;
  public currentButtonAreaId: string | null = null;
  private currentImageAsset: ImageAssetData | null = null;
  private isOpen: boolean = false;

  // Form controls
  private diameterInput: HTMLInputElement | null = null;
  private cropXSlider: HTMLInputElement | null = null;
  private cropYSlider: HTMLInputElement | null = null;
  private zoomSlider: HTMLInputElement | null = null;
  private rotationSlider: HTMLInputElement | null = null;
  private imageInput: HTMLInputElement | null = null;
  private previewContainer: HTMLElement | null = null;

  // Event callbacks
  private saveCallback: ((formData: ModalFormData) => void) | null = null;
  private cancelCallback: (() => void) | null = null;
  private imageChangeCallback: ((file: File | null) => void) | null = null;

  constructor() {
    this.createElement();
  }

  private createElement(): void {
    this.element = document.createElement('div');
    this.element.className = 'config-modal-overlay';
    this.element.setAttribute('data-testid', 'config-modal');
    this.element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;

    const modal = document.createElement('div');
    modal.className = 'config-modal';
    modal.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      width: 500px;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    `;

    modal.innerHTML = `
      <div class="modal-header">
        <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #333;">Configure Button</h2>
        <button class="close-button" data-testid="modal-close" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
      </div>

      <div class="modal-body">
        <!-- Button Settings -->
        <div class="form-section">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #555;">Button Size</h3>
          <div class="form-group">
            <label for="diameter-input">Diameter (inches):</label>
            <input type="number" id="diameter-input" data-testid="diameter-control" min="0.5" max="4.0" step="0.25" value="2.75" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #ddd; border-radius: 4px;">
            <div class="error-message" data-testid="diameter-error" style="color: #dc3545; font-size: 12px; margin-top: 4px; display: none;"></div>
          </div>
        </div>

        <!-- Image Upload -->
        <div class="form-section" style="margin-top: 24px;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #555;">Image</h3>
          <div class="image-upload" data-testid="image-upload">
            <input type="file" id="image-file-input" accept="image/*" style="display: none;">
            <div class="upload-area" style="border: 2px dashed #ddd; padding: 20px; text-align: center; border-radius: 4px; cursor: pointer; transition: all 0.2s ease;">
              <button type="button" data-testid="upload-button" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Choose Image</button>
              <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">or drag and drop an image here</p>
            </div>
            <button type="button" data-testid="remove-image" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-top: 8px; display: none;">Remove Image</button>
          </div>

          <!-- Image Preview -->
          <div class="image-preview-container" data-testid="image-preview" style="margin-top: 16px; display: none;">
            <div style="width: 150px; height: 150px; border: 2px solid #ddd; border-radius: 50%; overflow: hidden; margin: 0 auto; background: #f8f8f8; position: relative;">
              <img class="preview-image" style="width: 100%; height: 100%; object-fit: cover; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);" />
            </div>
          </div>
        </div>

        <!-- Image Adjustments -->
        <div class="form-section image-controls" style="margin-top: 24px; display: none;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #555;">Image Adjustments</h3>

          <div class="controls-grid" data-testid="crop-controls" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="form-group">
              <label for="crop-x-slider">Horizontal Position:</label>
              <input type="range" id="crop-x-slider" data-testid="crop-x-control" min="0" max="1" step="0.01" value="0.5" style="width: 100%;">
              <span class="slider-value">50%</span>
            </div>

            <div class="form-group">
              <label for="crop-y-slider">Vertical Position:</label>
              <input type="range" id="crop-y-slider" data-testid="crop-y-control" min="0" max="1" step="0.01" value="0.5" style="width: 100%;">
              <span class="slider-value">50%</span>
            </div>
          </div>

          <div class="form-group" style="margin-top: 16px;">
            <label for="zoom-slider">Zoom:</label>
            <input type="range" id="zoom-slider" data-testid="zoom-control" min="0.1" max="5" step="0.1" value="1" style="width: 100%;">
            <span class="slider-value">100%</span>
          </div>

          <div class="form-group" style="margin-top: 16px;">
            <label for="rotation-slider">Rotation:</label>
            <input type="range" id="rotation-slider" data-testid="rotation-control" min="0" max="359" step="1" value="0" style="width: 100%;">
            <span class="slider-value">0°</span>
          </div>
        </div>
      </div>

      <div class="modal-footer" style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
        <button type="button" class="cancel-button" data-testid="cancel-button" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Cancel</button>
        <button type="button" class="save-button" data-testid="save-button" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Save</button>
      </div>
    `;

    this.element.appendChild(modal);
    document.body.appendChild(this.element);

    this.bindElements();
    this.setupEventListeners();
  }

  private bindElements(): void {
    if (!this.element) return;

    this.diameterInput = this.element.querySelector('#diameter-input') as HTMLInputElement;
    this.cropXSlider = this.element.querySelector('#crop-x-slider') as HTMLInputElement;
    this.cropYSlider = this.element.querySelector('#crop-y-slider') as HTMLInputElement;
    this.zoomSlider = this.element.querySelector('#zoom-slider') as HTMLInputElement;
    this.rotationSlider = this.element.querySelector('#rotation-slider') as HTMLInputElement;
    this.imageInput = this.element.querySelector('#image-file-input') as HTMLInputElement;
    this.previewContainer = this.element.querySelector('.image-preview-container') as HTMLElement;
  }

  private setupEventListeners(): void {
    if (!this.element) return;

    // Close modal handlers
    const closeButton = this.element.querySelector('.close-button');
    const cancelButton = this.element.querySelector('.cancel-button');
    const saveButton = this.element.querySelector('.save-button');

    closeButton?.addEventListener('click', () => this.hide());
    cancelButton?.addEventListener('click', () => this.handleCancel());
    saveButton?.addEventListener('click', () => this.handleSave());

    // Image upload handlers
    const uploadButton = this.element.querySelector('[data-testid="upload-button"]');
    const removeButton = this.element.querySelector('[data-testid="remove-image"]');

    uploadButton?.addEventListener('click', () => this.imageInput?.click());
    removeButton?.addEventListener('click', () => this.handleRemoveImage());

    if (this.imageInput) {
      this.imageInput.addEventListener('change', this.handleImageInputChange.bind(this));
    }

    // Form control handlers with real-time preview
    [this.cropXSlider, this.cropYSlider, this.zoomSlider, this.rotationSlider].forEach(slider => {
      if (slider) {
        slider.addEventListener('input', () => {
          this.updateSliderValues();
          this.updateImagePreview();
        });
      }
    });

    // Diameter validation
    if (this.diameterInput) {
      this.diameterInput.addEventListener('input', this.validateDiameter.bind(this));
    }

    // Escape key to close
    document.addEventListener('keydown', this.handleKeyDown.bind(this));

    // Click outside to close
    this.element.addEventListener('click', this.handleOverlayClick.bind(this));
  }

  // Lifecycle methods
  async show(buttonAreaId: string): Promise<void> {
    this.currentButtonAreaId = buttonAreaId;
    this.isOpen = true;

    if (this.element) {
      this.element.style.display = 'flex';
      // Add fade-in animation
      this.element.style.opacity = '0';
      setTimeout(() => {
        if (this.element) {
          this.element.style.transition = 'opacity 0.2s ease';
          this.element.style.opacity = '1';
        }
      }, 10);
    }
  }

  async hide(): Promise<void> {
    this.isOpen = false;

    if (this.element) {
      this.element.style.opacity = '0';
      setTimeout(() => {
        if (this.element) {
          this.element.style.display = 'none';
        }
      }, 200);
    }

    this.currentButtonAreaId = null;
    this.currentImageAsset = null;
  }

  isVisible(): boolean {
    return this.isOpen;
  }

  // Data binding methods
  loadButtonAreaData(buttonArea: ButtonAreaData, imageAsset?: ImageAssetData): void {
    this.currentImageAsset = imageAsset || null;

    if (this.diameterInput) this.diameterInput.value = buttonArea.diameter.toString();
    if (this.cropXSlider) this.cropXSlider.value = buttonArea.cropX.toString();
    if (this.cropYSlider) this.cropYSlider.value = buttonArea.cropY.toString();
    if (this.zoomSlider) this.zoomSlider.value = buttonArea.zoom.toString();
    if (this.rotationSlider) this.rotationSlider.value = buttonArea.rotation.toString();

    this.updateSliderValues();
    this.updateImageDisplay();
  }

  getFormData(): ModalFormData {
    return {
      diameter: parseFloat(this.diameterInput?.value || '2.75'),
      cropX: parseFloat(this.cropXSlider?.value || '0.5'),
      cropY: parseFloat(this.cropYSlider?.value || '0.5'),
      zoom: parseFloat(this.zoomSlider?.value || '1'),
      rotation: parseInt(this.rotationSlider?.value || '0'),
      imageFile: this.imageInput?.files?.[0]
    };
  }

  resetForm(): void {
    if (this.diameterInput) this.diameterInput.value = '2.75';
    if (this.cropXSlider) this.cropXSlider.value = '0.5';
    if (this.cropYSlider) this.cropYSlider.value = '0.5';
    if (this.zoomSlider) this.zoomSlider.value = '1';
    if (this.rotationSlider) this.rotationSlider.value = '0';
    if (this.imageInput) this.imageInput.value = '';

    this.currentImageAsset = null;
    this.updateSliderValues();
    this.updateImageDisplay();
  }

  // Simplified event handlers and validation methods
  private handleSave(): void {
    const validation = this.validateForm();
    if (validation.isValid && this.saveCallback) {
      this.saveCallback(this.getFormData());
    }
  }

  private handleCancel(): void {
    if (this.cancelCallback) {
      this.cancelCallback();
    }
    this.hide();
  }

  private handleImageInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file && this.imageChangeCallback) {
      this.imageChangeCallback(file);
    }
  }

  validateForm(): ValidationResult {
    const errors: string[] = [];
    const diameter = parseFloat(this.diameterInput?.value || '2.75');

    if (diameter < 0.5 || diameter > 4.0) {
      errors.push('Diameter must be between 0.5 and 4.0 inches');
    }

    return { isValid: errors.length === 0, errors };
  }

  // Event handlers
  onSave = (callback: (formData: ModalFormData) => void): void => {
    this.saveCallback = callback;
  };

  onCancel = (callback: () => void): void => {
    this.cancelCallback = callback;
  };

  onImageChange = (callback: (file: File | null) => void): void => {
    this.imageChangeCallback = callback;
  };

  async uploadImage(): Promise<File | null> {
    return this.imageInput?.files?.[0] || null;
  }

  async removeImage(): Promise<boolean> {
    if (this.imageInput) {
      this.imageInput.value = '';
    }
    this.currentImageAsset = null;
    this.updateImageDisplay();
    return true;
  }

  // Utility methods (simplified)
  private updateSliderValues(): void {
    // Update slider value displays
    const sliders = this.element?.querySelectorAll('input[type="range"]');
    sliders?.forEach(slider => {
      const valueSpan = slider.parentElement?.querySelector('.slider-value');
      if (valueSpan) {
        const value = parseFloat((slider as HTMLInputElement).value);
        if (slider.id.includes('crop')) {
          valueSpan.textContent = `${Math.round(value * 100)}%`;
        } else if (slider.id.includes('zoom')) {
          valueSpan.textContent = `${Math.round(value * 100)}%`;
        } else if (slider.id.includes('rotation')) {
          valueSpan.textContent = `${value}°`;
        }
      }
    });
  }

  private updateImageDisplay(): void {
    // Show/hide image controls and preview
    const imageControls = this.element?.querySelector('.image-controls') as HTMLElement;
    const previewContainer = this.element?.querySelector('.image-preview-container') as HTMLElement;
    const previewImage = this.element?.querySelector('.preview-image') as HTMLImageElement;
    const removeButton = this.element?.querySelector('[data-testid="remove-image"]') as HTMLElement;

    if (this.currentImageAsset) {
      if (imageControls) imageControls.style.display = 'block';
      if (previewContainer) previewContainer.style.display = 'block';
      if (previewImage) previewImage.src = this.currentImageAsset.thumbnailUrl;
      if (removeButton) removeButton.style.display = 'block';
    } else {
      if (imageControls) imageControls.style.display = 'none';
      if (previewContainer) previewContainer.style.display = 'none';
      if (removeButton) removeButton.style.display = 'none';
    }
  }

  private updateImagePreview(): void {
    if (!this.currentImageAsset) return;

    const previewImage = this.element?.querySelector('.preview-image') as HTMLImageElement;
    if (!previewImage) return;

    // Get current form values
    const cropX = parseFloat(this.cropXSlider?.value || '0.5');
    const cropY = parseFloat(this.cropYSlider?.value || '0.5');
    const zoom = parseFloat(this.zoomSlider?.value || '1');
    const rotation = parseFloat(this.rotationSlider?.value || '0');

    // Apply transform to preview image - fix positioning logic
    // The container clips to circle, image moves within it
    previewImage.style.cssText = `
      width: ${100 * zoom}%;
      height: ${100 * zoom}%;
      object-fit: cover;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%)
                 translate(${(0.5 - cropX) * 100}%, ${(0.5 - cropY) * 100}%)
                 rotate(${rotation}deg);
    `;

    // Ensure the container maintains its circular shape
    const previewContainer = previewImage.parentElement;
    if (previewContainer) {
      previewContainer.style.overflow = 'hidden';
      previewContainer.style.borderRadius = '50%';
    }
  }

  private validateDiameter(): void {
    // Real-time diameter validation would be implemented here
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen) {
      this.hide();
    }
  }

  private handleOverlayClick(event: MouseEvent): void {
    if (event.target === this.element) {
      this.hide();
    }
  }

  private handleRemoveImage(): void {
    this.removeImage();
    if (this.imageChangeCallback) {
      this.imageChangeCallback(null);
    }
  }
}