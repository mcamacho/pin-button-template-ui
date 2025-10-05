/**
 * Component Interface Contracts
 * Defines the interfaces for UI components and their interactions
 */

// Main Canvas Component
export interface CanvasComponent {
  // Lifecycle
  initialize(container: HTMLElement): Promise<void>;
  destroy(): void;

  // Session Management
  loadSession(session: Session): Promise<void>;
  getCurrentSession(): Session | null;

  // Button Area Management
  addButtonArea(x: number, y: number): Promise<ButtonArea>;
  removeButtonArea(id: string): Promise<boolean>;
  getButtonArea(id: string): ButtonArea | null;
  getAllButtonAreas(): ButtonArea[];

  // Event Handling
  onButtonAreaClick: (callback: (buttonArea: ButtonArea) => void) => void;
  onImageDrop: (callback: (files: FileList, buttonAreaId: string | null) => void) => void;
  onLayoutChange: (callback: (session: Session) => void) => void;

  // Rendering
  render(): void;
  redraw(): void;
  setZoom(level: number): void;
}

// Configuration Modal Component
export interface ModalComponent {
  // Lifecycle
  show(buttonAreaId: string): Promise<void>;
  hide(): Promise<void>;
  isVisible(): boolean;

  // Data Binding
  loadButtonAreaData(buttonArea: ButtonArea, imageAsset?: ImageAsset): void;
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

// Button Area Component
export interface ButtonAreaComponent {
  // Properties
  id: string;
  element: HTMLElement;

  // State Management
  setData(buttonArea: ButtonArea): void;
  getData(): ButtonArea;
  setImageAsset(imageAsset: ImageAsset | null): void;
  getImageAsset(): ImageAsset | null;

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

// Print Button Component
export interface PrintButtonComponent {
  // Lifecycle
  initialize(container: HTMLElement): void;

  // State Management
  setEnabled(enabled: boolean): void;
  setLoading(loading: boolean): void;

  // Event Handling
  onClick: (callback: () => void) => void;

  // Print Operations
  triggerPrint(sessionId: string, config?: Partial<PrintConfiguration>): Promise<void>;
}

// Application Controller Interface
export interface AppController {
  // Initialization
  initialize(): Promise<void>;

  // Session Management
  createNewSession(): Promise<Session>;
  saveSession(name: string): Promise<Session>;
  loadSession(id: string): Promise<Session>;
  deleteSession(id: string): Promise<boolean>;

  // Image Management
  handleImageUpload(file: File, buttonAreaId?: string): Promise<ImageAsset>;
  handleImageDrop(files: FileList, buttonAreaId?: string): Promise<void>;

  // UI State Management
  showModal(buttonAreaId: string): Promise<void>;
  hideModal(): Promise<void>;
  updateButtonArea(id: string, updates: Partial<ButtonArea>): Promise<void>;

  // Print Operations
  printCurrentSession(config?: Partial<PrintConfiguration>): Promise<void>;
}

// Supporting Types
export interface ModalFormData {
  diameter: number;
  imageFile?: File;
  cropX: number;
  cropY: number;
  zoom: number;
  rotation: number;
}

export interface ImageTransform {
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

// Re-export core types
export interface Session {
  id: string;
  name: string | null;
  isTemporary: boolean;
  pageWidth: number;
  pageHeight: number;
  createdAt: Date;
  updatedAt: Date;
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

export interface ImageAsset {
  id: string;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
  dataUrl: string;
  thumbnailUrl: string;
  uploadedAt: Date;
  lastUsedAt: Date;
}

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