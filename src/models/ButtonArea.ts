import { ValidationError } from '@/utils/validation';

export interface ButtonAreaData {
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

export type ButtonAreaState = 'empty' | 'hasImage' | 'configuring';

export class ButtonArea implements ButtonAreaData {
  public id: string;
  public sessionId: string;
  public x: number;
  public y: number;
  public diameter: number;
  public imageAssetId: string | null;
  public cropX: number;
  public cropY: number;
  public zoom: number;
  public rotation: number;

  constructor(data: Omit<ButtonAreaData, 'id'> & { id?: string }) {
    this.id = data.id || this.generateId();
    this.sessionId = data.sessionId;
    this.x = data.x;
    this.y = data.y;
    this.diameter = data.diameter || 2.75;
    this.imageAssetId = data.imageAssetId || null;
    this.cropX = data.cropX || 0.5;
    this.cropY = data.cropY || 0.5;
    this.zoom = data.zoom || 1.0;
    this.rotation = data.rotation || 0.0;

    this.validate();
  }

  /**
   * Generate unique ID for button area
   */
  private generateId(): string {
    return `btn-${crypto.randomUUID()}`;
  }

  /**
   * Validate button area data according to data-model.md rules
   */
  private validate(): void {
    const errors: string[] = [];

    // Diameter validation: 0.5 <= diameter <= 4.0 inches
    if (this.diameter < 0.5 || this.diameter > 4.0) {
      errors.push('Diameter must be between 0.5 and 4.0 inches');
    }

    // Position validation: must fit within Letter page bounds (8.5" x 11")
    const halfDiameter = this.diameter / 2;
    if (this.x - halfDiameter < 0 || this.x + halfDiameter > 8.5) {
      errors.push('Button area X position must fit within page width (8.5")');
    }
    if (this.y - halfDiameter < 0 || this.y + halfDiameter > 11.0) {
      errors.push('Button area Y position must fit within page height (11.0")');
    }

    // Crop validation: 0.0 <= value <= 1.0
    if (this.cropX < 0.0 || this.cropX > 1.0) {
      errors.push('Crop X must be between 0.0 and 1.0');
    }
    if (this.cropY < 0.0 || this.cropY > 1.0) {
      errors.push('Crop Y must be between 0.0 and 1.0');
    }

    // Zoom validation: 0.1 <= zoom <= 5.0
    if (this.zoom < 0.1 || this.zoom > 5.0) {
      errors.push('Zoom must be between 0.1 and 5.0');
    }

    // Rotation validation: 0 <= rotation < 360
    if (this.rotation < 0 || this.rotation >= 360) {
      errors.push('Rotation must be between 0 and 360 degrees');
    }

    if (errors.length > 0) {
      throw new ValidationError('ButtonArea validation failed', errors);
    }
  }

  /**
   * Get current state based on data
   */
  getState(): ButtonAreaState {
    if (!this.imageAssetId) {
      return 'empty';
    }
    return 'hasImage';
  }

  /**
   * Update button area properties with validation
   */
  update(updates: Partial<Omit<ButtonAreaData, 'id'>>): void {
    const updatedData = { ...this.toData(), ...updates };

    // Apply updates
    Object.assign(this, updatedData);

    // Validate after updates
    this.validate();
  }

  /**
   * Set image for button area (state transition: Empty -> HasImage)
   */
  setImage(imageAssetId: string): void {
    if (this.getState() === 'configuring') {
      throw new Error('Cannot set image while button area is being configured');
    }

    this.imageAssetId = imageAssetId;
    this.validate();
  }

  /**
   * Remove image from button area (state transition: HasImage -> Empty)
   */
  removeImage(): void {
    if (this.getState() === 'configuring') {
      throw new Error('Cannot remove image while button area is being configured');
    }

    this.imageAssetId = null;
    // Reset to default crop/zoom when image is removed
    this.cropX = 0.5;
    this.cropY = 0.5;
    this.zoom = 1.0;
    this.rotation = 0.0;
  }

  /**
   * Check if button area overlaps with another
   */
  overlaps(other: ButtonArea): boolean {
    const distance = Math.sqrt(
      Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2)
    );
    const minDistance = (this.diameter + other.diameter) / 2;
    return distance < minDistance;
  }

  /**
   * Check if button area fits within page bounds
   */
  fitsInPage(pageWidth: number = 8.5, pageHeight: number = 11.0): boolean {
    const halfDiameter = this.diameter / 2;
    return (
      this.x - halfDiameter >= 0 &&
      this.x + halfDiameter <= pageWidth &&
      this.y - halfDiameter >= 0 &&
      this.y + halfDiameter <= pageHeight
    );
  }

  /**
   * Convert to plain data object
   */
  toData(): ButtonAreaData {
    return {
      id: this.id,
      sessionId: this.sessionId,
      x: this.x,
      y: this.y,
      diameter: this.diameter,
      imageAssetId: this.imageAssetId,
      cropX: this.cropX,
      cropY: this.cropY,
      zoom: this.zoom,
      rotation: this.rotation,
    };
  }

  /**
   * Create ButtonArea from data
   */
  static fromData(data: ButtonAreaData): ButtonArea {
    return new ButtonArea(data);
  }

  /**
   * Create ButtonArea with default values at position
   */
  static createAt(sessionId: string, x: number, y: number, diameter: number = 2.75): ButtonArea {
    return new ButtonArea({
      sessionId,
      x,
      y,
      diameter,
      imageAssetId: null,
      cropX: 0.5,
      cropY: 0.5,
      zoom: 1.0,
      rotation: 0.0,
    });
  }
}