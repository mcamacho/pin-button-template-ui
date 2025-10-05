import { ValidationError, ModelValidator } from '@/utils/validation';
import type { ButtonArea } from './ButtonArea';

export interface SessionData {
  id: string;
  name: string | null;
  isTemporary: boolean;
  pageWidth: number;
  pageHeight: number;
  createdAt: Date;
  updatedAt: Date;
}

export type SessionState = 'new' | 'temporary' | 'named' | 'deleted';

export class Session implements SessionData {
  public id: string;
  public name: string | null;
  public isTemporary: boolean;
  public pageWidth: number;
  public pageHeight: number;
  public createdAt: Date;
  public updatedAt: Date;
  private buttonAreas: ButtonArea[] = [];

  constructor(data: Omit<SessionData, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = data.id || this.generateId();
    this.name = data.name || null;
    this.isTemporary = data.isTemporary ?? true;
    this.pageWidth = data.pageWidth || 8.5;
    this.pageHeight = data.pageHeight || 11.0;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();

    this.validate();
  }

  /**
   * Generate unique ID for session
   */
  private generateId(): string {
    return `session-${crypto.randomUUID()}`;
  }

  /**
   * Validate session data according to data-model.md rules
   */
  private validate(): void {
    const errors: string[] = [];

    // Name validation
    const nameResult = ModelValidator.validateSessionName(this.name);
    errors.push(...nameResult.errors);

    // Page dimensions validation
    const pageResult = ModelValidator.validatePageDimensions(this.pageWidth, this.pageHeight);
    errors.push(...pageResult.errors);

    // Button areas count validation (max 50)
    if (this.buttonAreas.length > 50) {
      errors.push('Session cannot have more than 50 button areas');
    }

    if (errors.length > 0) {
      throw new ValidationError('Session validation failed', errors);
    }
  }

  /**
   * Get current state based on data
   */
  getState(): SessionState {
    if (this.isTemporary) {
      return 'temporary';
    }
    if (this.name) {
      return 'named';
    }
    return 'new';
  }

  /**
   * Update session properties with validation
   */
  update(updates: Partial<Omit<SessionData, 'id' | 'createdAt'>>): void {
    // Apply updates
    Object.assign(this, {
      ...updates,
      updatedAt: new Date(),
    });

    // Validate after updates
    this.validate();
  }

  /**
   * Save session with name (state transition: Temporary -> Named)
   */
  saveWithName(name: string): void {
    if (this.getState() === 'deleted') {
      throw new Error('Cannot save deleted session');
    }

    // Validate name
    const nameResult = ModelValidator.validateSessionName(name);
    if (!nameResult.isValid) {
      throw new ValidationError('Invalid session name', nameResult.errors);
    }

    this.name = name;
    this.isTemporary = false;
    this.updatedAt = new Date();
    this.validate();
  }

  /**
   * Make session temporary (state transition: Named -> Temporary)
   */
  makeTemporary(): void {
    if (this.getState() === 'deleted') {
      throw new Error('Cannot modify deleted session');
    }

    this.name = null;
    this.isTemporary = true;
    this.updatedAt = new Date();
  }

  /**
   * Add button area to session
   */
  addButtonArea(buttonArea: ButtonArea): void {
    if (this.buttonAreas.length >= 50) {
      throw new Error('Session cannot have more than 50 button areas');
    }

    // Check for duplicate IDs
    if (this.buttonAreas.some(ba => ba.id === buttonArea.id)) {
      throw new Error('Button area with this ID already exists in session');
    }

    // Check if button area fits in page
    if (!buttonArea.fitsInPage(this.pageWidth, this.pageHeight)) {
      throw new Error('Button area does not fit within page bounds');
    }

    // Check for overlaps
    const overlapping = this.buttonAreas.find(ba => ba.overlaps(buttonArea));
    if (overlapping) {
      throw new Error(`Button area overlaps with existing button area ${overlapping.id}`);
    }

    this.buttonAreas.push(buttonArea);
    this.updatedAt = new Date();
  }

  /**
   * Remove button area from session
   */
  removeButtonArea(buttonAreaId: string): boolean {
    const index = this.buttonAreas.findIndex(ba => ba.id === buttonAreaId);
    if (index === -1) {
      return false;
    }

    this.buttonAreas.splice(index, 1);
    this.updatedAt = new Date();
    return true;
  }

  /**
   * Get button area by ID
   */
  getButtonArea(buttonAreaId: string): ButtonArea | null {
    return this.buttonAreas.find(ba => ba.id === buttonAreaId) || null;
  }

  /**
   * Get all button areas
   */
  getButtonAreas(): ButtonArea[] {
    return [...this.buttonAreas];
  }

  /**
   * Clear all button areas
   */
  clearButtonAreas(): void {
    this.buttonAreas = [];
    this.updatedAt = new Date();
  }

  /**
   * Get button areas count
   */
  getButtonAreaCount(): number {
    return this.buttonAreas.length;
  }

  /**
   * Check if session has unsaved changes
   */
  hasUnsavedChanges(lastSavedAt?: Date): boolean {
    if (!lastSavedAt) {
      return this.isTemporary;
    }
    return this.updatedAt > lastSavedAt;
  }

  /**
   * Calculate optimal button layout for current page size
   */
  calculateOptimalLayout(buttonDiameter: number = 2.75, spacing: number = 0.25): { maxRows: number; maxCols: number; totalButtons: number } {
    const usableWidth = this.pageWidth - (spacing * 2); // Account for margins
    const usableHeight = this.pageHeight - (spacing * 2);

    const buttonWithSpacing = buttonDiameter + spacing;

    const maxCols = Math.floor(usableWidth / buttonWithSpacing);
    const maxRows = Math.floor(usableHeight / buttonWithSpacing);
    const totalButtons = maxRows * maxCols;

    return { maxRows, maxCols, totalButtons };
  }

  /**
   * Auto-arrange button areas in optimal grid
   */
  autoArrangeButtons(buttonDiameter: number = 2.75, spacing: number = 0.25): void {
    const layout = this.calculateOptimalLayout(buttonDiameter, spacing);
    const buttonWithSpacing = buttonDiameter + spacing;

    // Start positions (centered on page)
    const startX = (this.pageWidth - (layout.maxCols * buttonWithSpacing - spacing)) / 2 + buttonDiameter / 2;
    const startY = (this.pageHeight - (layout.maxRows * buttonWithSpacing - spacing)) / 2 + buttonDiameter / 2;

    let buttonIndex = 0;
    for (let row = 0; row < layout.maxRows && buttonIndex < this.buttonAreas.length; row++) {
      for (let col = 0; col < layout.maxCols && buttonIndex < this.buttonAreas.length; col++) {
        const buttonArea = this.buttonAreas[buttonIndex];
        buttonArea.update({
          x: startX + (col * buttonWithSpacing),
          y: startY + (row * buttonWithSpacing),
          diameter: buttonDiameter,
        });
        buttonIndex++;
      }
    }

    this.updatedAt = new Date();
  }

  /**
   * Convert to plain data object
   */
  toData(): SessionData {
    return {
      id: this.id,
      name: this.name,
      isTemporary: this.isTemporary,
      pageWidth: this.pageWidth,
      pageHeight: this.pageHeight,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Create Session from data
   */
  static fromData(data: SessionData): Session {
    return new Session(data);
  }

  /**
   * Create new temporary session
   */
  static createTemporary(pageWidth: number = 8.5, pageHeight: number = 11.0): Session {
    return new Session({
      name: null,
      isTemporary: true,
      pageWidth,
      pageHeight,
    });
  }

  /**
   * Create new named session
   */
  static createNamed(name: string, pageWidth: number = 8.5, pageHeight: number = 11.0): Session {
    return new Session({
      name,
      isTemporary: false,
      pageWidth,
      pageHeight,
    });
  }
}