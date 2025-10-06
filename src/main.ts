import { DatabaseService } from '@/services/DatabaseService';
import { ImageService } from '@/services/ImageService';
import { CanvasComponent } from '@/components/Canvas';
import { ModalComponent } from '@/components/Modal';
import { PrintButtonComponentImpl } from '@/components/PrintButton';
import { Session, SessionData } from '@/models/Session';
import { ImageAsset, ImageAssetData } from '@/models/ImageAsset';
import { ButtonArea, ButtonAreaData } from '@/models/ButtonArea';
import { PrintConfiguration } from '@/models/PrintConfiguration';

export interface AppController {
  // Initialization
  initialize(): Promise<void>;

  // Session Management
  createNewSession(): Promise<SessionData>;
  saveSession(name: string): Promise<SessionData>;
  loadSession(id: string): Promise<SessionData>;
  deleteSession(id: string): Promise<boolean>;

  // Image Management
  handleImageUpload(file: File, buttonAreaId?: string): Promise<ImageAssetData>;
  handleImageDrop(files: FileList, buttonAreaId?: string): Promise<void>;

  // UI State Management
  showModal(buttonAreaId: string): Promise<void>;
  hideModal(): Promise<void>;
  updateButtonArea(id: string, updates: Partial<ButtonAreaData>): Promise<void>;

  // Print Operations
  printCurrentSession(config?: Partial<PrintConfiguration>): Promise<void>;
}

export class PinButtonApp implements AppController {
  // Services
  private databaseService: DatabaseService;
  private imageService: ImageService;

  // Components
  private canvasComponent: CanvasComponent | null = null;
  private modalComponent: ModalComponent | null = null;
  private printButtonComponent: PrintButtonComponentImpl | null = null;

  // State
  private currentSession: Session | null = null;
  private loadedImageAssets: Map<string, ImageAsset> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.databaseService = new DatabaseService();
    this.imageService = new ImageService();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize database
      await this.databaseService.initialize();

      // Initialize UI components
      await this.initializeComponents();

      // Setup event handlers
      this.setupEventHandlers();

      // Load or create initial session
      await this.initializeSession();

      this.isInitialized = true;

    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
      throw error;
    }
  }

  private async initializeComponents(): Promise<void> {
    // Initialize canvas component
    const canvasContainer = document.querySelector('#canvas-container') as HTMLElement;
    if (!canvasContainer) {
      throw new Error('Canvas container not found in DOM');
    }

    this.canvasComponent = new CanvasComponent();
    await this.canvasComponent.initialize(canvasContainer);

    // Initialize modal component
    this.modalComponent = new ModalComponent();

    // Initialize print button component
    const printContainer = document.querySelector('#print-container') as HTMLElement;
    if (!printContainer) {
      throw new Error('Print container not found in DOM');
    }

    this.printButtonComponent = new PrintButtonComponentImpl();
    this.printButtonComponent.initialize(printContainer);
  }

  private setupEventHandlers(): void {
    if (!this.canvasComponent || !this.modalComponent || !this.printButtonComponent) {
      throw new Error('Components not initialized');
    }

    // Canvas events
    this.canvasComponent.onButtonAreaClick((buttonArea) => {
      this.showModal(buttonArea.id);
    });

    this.canvasComponent.onImageDrop(async (files, buttonAreaId) => {
      await this.handleImageDrop(files, buttonAreaId ?? undefined);
    });

    this.canvasComponent.onLayoutChange((session) => {
      this.handleLayoutChange(session);
    });

    // Modal events
    this.modalComponent.onSave(async (formData) => {
      await this.handleModalSave(formData);
    });

    this.modalComponent.onCancel(() => {
      this.hideModal();
    });

    this.modalComponent.onImageChange(async (file) => {
      if (file) {
        await this.handleImageUpload(file, this.modalComponent?.currentButtonAreaId ?? undefined);
      }
    });

    // Print button events
    this.printButtonComponent.onClick(async () => {
      await this.printCurrentSession();
    });

    // Global keyboard handler for Ctrl+P
    document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));

    // Global keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
  }

  private async initializeSession(): Promise<void> {
    // Try to load the most recent temporary session
    const sessions = await this.databaseService.listSessions(true);
    const tempSession = sessions.find(s => s.isTemporary);

    if (tempSession) {
      await this.loadSession(tempSession.id);
    } else {
      await this.createNewSession();
    }
  }

  // Session Management
  async createNewSession(): Promise<SessionData> {
    try {
      const sessionData = await this.databaseService.createSession({
        name: null,
        isTemporary: true,
        pageWidth: 8.5,
        pageHeight: 11.0
      });

      this.currentSession = Session.fromData(sessionData);

      // Add default button areas to the new session
      await this.createDefaultButtonAreas();

      // Load the created button areas back into the session
      const buttonAreas = await this.databaseService.getButtonAreasBySession(this.currentSession.id);
      this.currentSession.clearButtonAreas();

      for (const buttonAreaData of buttonAreas) {
        const buttonArea = ButtonArea.fromData(buttonAreaData);
        this.currentSession.addButtonArea(buttonArea);
      }

      if (this.canvasComponent) {
        // Set the canvas current session directly
        (this.canvasComponent as any).currentSession = this.currentSession;
        this.canvasComponent.render();
      }

      return this.currentSession.toData();
    } catch (error) {
      console.error('Failed to create new session:', error);
      this.showError('Failed to create new session');
      throw error;
    }
  }

  private async createDefaultButtonAreas(): Promise<void> {
    if (!this.currentSession) return;

    // Create safe button positions
    const safePositions = [
      { x: 2.5, y: 2.5 }, // Top-left area
      { x: 6.0, y: 2.5 }, // Top-right area
      { x: 2.5, y: 5.5 }, // Middle-left
      { x: 6.0, y: 5.5 }, // Middle-right
      { x: 2.5, y: 8.5 }, // Bottom-left
      { x: 6.0, y: 8.5 }, // Bottom-right
    ];

    for (const position of safePositions) {
      try {
        await this.databaseService.createButtonArea({
          sessionId: this.currentSession.id,
          x: position.x,
          y: position.y,
          diameter: 2.75,
          imageAssetId: null,
          cropX: 0.5,
          cropY: 0.5,
          zoom: 1.0,
          rotation: 0.0
        });
      } catch (error) {
        console.error('Failed to create default button area:', error);
      }
    }
  }

  async saveSession(name: string): Promise<SessionData> {
    if (!this.currentSession) {
      throw new Error('No active session to save');
    }

    try {
      this.currentSession.saveWithName(name);
      const updatedSession = await this.databaseService.updateSession(
        this.currentSession.id,
        this.currentSession.toData()
      );

      this.showSuccess(`Session "${name}" saved successfully`);
      return updatedSession;
    } catch (error) {
      console.error('Failed to save session:', error);
      this.showError('Failed to save session');
      throw error;
    }
  }

  async loadSession(id: string): Promise<SessionData> {
    try {
      const sessionData = await this.databaseService.getSession(id);
      if (!sessionData) {
        throw new Error('Session not found');
      }

      this.currentSession = Session.fromData(sessionData);

      // Load button areas from database and add to session
      const buttonAreas = await this.databaseService.getButtonAreasBySession(id);

      // Clear existing button areas and add the loaded ones
      this.currentSession.clearButtonAreas();

      for (const buttonAreaData of buttonAreas) {
        try {
          const buttonArea = ButtonArea.fromData(buttonAreaData);
          this.currentSession.addButtonArea(buttonArea);
        } catch (error) {
          console.error('Failed to add button area to session:', error);
        }
      }

      // Load associated images
      await this.preloadSessionImages();

      // Pass the session object itself to canvas, not just the data
      if (this.canvasComponent) {
        // Set the canvas current session directly
        (this.canvasComponent as any).currentSession = this.currentSession;
        this.canvasComponent.render();
      }

      return this.currentSession.toData();
    } catch (error) {
      console.error('Failed to load session:', error);
      this.showError('Failed to load session');
      throw error;
    }
  }

  async deleteSession(id: string): Promise<boolean> {
    try {
      const success = await this.databaseService.deleteSession(id);
      if (success && this.currentSession?.id === id) {
        // Create a new session if we deleted the current one
        await this.createNewSession();
      }
      return success;
    } catch (error) {
      console.error('Failed to delete session:', error);
      this.showError('Failed to delete session');
      return false;
    }
  }

  // Image Management
  async handleImageUpload(file: File, buttonAreaId?: string): Promise<ImageAssetData> {
    try {
      // Validate file
      const validation = await this.imageService.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(`Invalid image: ${validation.errors.join(', ')}`);
      }

      // Load and process image
      const loadResult = await this.imageService.loadImageFromFile(file);
      if (!loadResult.success) {
        throw new Error(loadResult.error || 'Failed to load image');
      }

      // Generate thumbnail
      const thumbnailUrl = await this.imageService.generateThumbnail(
        loadResult.imageData!,
        200,
        200
      );

      // Create image asset
      const imageData = await this.databaseService.createImageAsset({
        filename: file.name,
        mimeType: file.type,
        width: loadResult.width!,
        height: loadResult.height!,
        fileSize: file.size,
        dataUrl: loadResult.imageData!,
        thumbnailUrl
      });

      const imageAsset = ImageAsset.fromData(imageData);
      this.loadedImageAssets.set(imageAsset.id, imageAsset);

      // Assign to button area if specified
      if (buttonAreaId && this.canvasComponent) {
        this.canvasComponent.updateButtonAreaImage(buttonAreaId, imageAsset);
        await this.databaseService.updateButtonArea(buttonAreaId, {
          imageAssetId: imageAsset.id
        });

        // Update the modal display to show the new image
        if (this.modalComponent && this.currentSession) {
          const updatedButtonArea = this.currentSession.getButtonArea(buttonAreaId);
          if (updatedButtonArea) {
            this.modalComponent.loadButtonAreaData(updatedButtonArea.toData(), imageAsset.toData());
          }
        }
      }

      this.showSuccess('Image uploaded successfully');
      return imageData;

    } catch (error) {
      console.error('Image upload failed:', error);
      this.showError(error instanceof Error ? error.message : 'Failed to upload image');
      throw error;
    }
  }

  async handleImageDrop(files: FileList, buttonAreaId?: string): Promise<void> {
    if (files.length === 0) return;

    const file = files[0]; // Take first file only
    try {
      await this.handleImageUpload(file, buttonAreaId);
    } catch (error) {
      // Error already handled in handleImageUpload
    }
  }

  // UI State Management
  async showModal(buttonAreaId: string): Promise<void> {
    if (!this.modalComponent || !this.currentSession) return;

    const buttonArea = this.currentSession.getButtonArea(buttonAreaId);
    if (!buttonArea) return;

    const imageAsset = buttonArea.imageAssetId ?
      this.loadedImageAssets.get(buttonArea.imageAssetId) : null;

    this.modalComponent.loadButtonAreaData(
      buttonArea.toData(),
      imageAsset?.toData()
    );

    await this.modalComponent.show(buttonAreaId);
  }

  async hideModal(): Promise<void> {
    if (this.modalComponent) {
      await this.modalComponent.hide();
    }
  }

  async updateButtonArea(id: string, updates: Partial<ButtonAreaData>): Promise<void> {
    if (!this.currentSession) return;

    try {
      const buttonArea = this.currentSession.getButtonArea(id);
      if (buttonArea) {
        buttonArea.update(updates);
        await this.databaseService.updateButtonArea(id, buttonArea.toData());
      }
    } catch (error) {
      console.error('Failed to update button area:', error);
      this.showError('Failed to update button area');
    }
  }

  // Print Operations
  async printCurrentSession(config?: Partial<PrintConfiguration>): Promise<void> {
    if (!this.currentSession || !this.printButtonComponent) return;

    try {
      // Use the PrintButton component's triggerPrint method which handles the styling correctly
      await this.printButtonComponent.triggerPrint(this.currentSession.id, config);
    } catch (error) {
      console.error('Print failed:', error);
      this.showError('Failed to print session');
    }
  }

  // Event Handlers
  private async handleModalSave(formData: any): Promise<void> {
    if (!this.currentSession || !this.modalComponent?.currentButtonAreaId) return;

    const buttonAreaId = this.modalComponent.currentButtonAreaId;

    try {
      // Update button area in database with new settings
      await this.databaseService.updateButtonArea(buttonAreaId, {
        diameter: formData.diameter,
        cropX: formData.cropX,
        cropY: formData.cropY,
        zoom: formData.zoom,
        rotation: formData.rotation
      });

      // Update local session
      const buttonArea = this.currentSession.getButtonArea(buttonAreaId);
      if (buttonArea) {
        buttonArea.update({
          diameter: formData.diameter,
          cropX: formData.cropX,
          cropY: formData.cropY,
          zoom: formData.zoom,
          rotation: formData.rotation
        });

        // Update canvas display
        if (this.canvasComponent) {
          (this.canvasComponent as any).currentSession = this.currentSession;
          this.canvasComponent.render();
        }
      }

      this.showSuccess('Button settings saved successfully');
      await this.hideModal();

    } catch (error) {
      console.error('Failed to save modal changes:', error);
      this.showError('Failed to save button settings');
    }
  }

  private handleLayoutChange(session: SessionData): void {
    // Update current session with layout changes
    if (this.currentSession) {
      this.currentSession.update(session);
    }
  }

  private handleGlobalKeydown(event: KeyboardEvent): void {
    // Intercept Ctrl+P or Cmd+P
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
      event.preventDefault();
      event.stopPropagation();

      // Use our custom print function instead of browser default
      this.printCurrentSession();
    }
  }

  private handleKeyboardShortcuts(event: KeyboardEvent): void {
    // Ctrl/Cmd + S: Save session
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      this.promptSaveSession();
    }

    // Note: Ctrl/Cmd + P is handled by handleGlobalKeydown

    // Escape: Close modal
    if (event.key === 'Escape' && this.modalComponent?.isVisible()) {
      this.hideModal();
    }
  }

  // Utility Methods
  private async preloadSessionImages(): Promise<void> {
    if (!this.currentSession) return;

    const buttonAreas = this.currentSession.getButtonAreas();
    const imageIds = buttonAreas
      .map(ba => ba.imageAssetId)
      .filter(id => id !== null) as string[];

    for (const imageId of imageIds) {
      if (!this.loadedImageAssets.has(imageId)) {
        const imageData = await this.databaseService.getImageAsset(imageId);
        if (imageData) {
          const imageAsset = ImageAsset.fromData(imageData);
          this.loadedImageAssets.set(imageId, imageAsset);
        }
      }
    }
  }

  private promptSaveSession(): void {
    const name = prompt('Enter session name:');
    if (name) {
      this.saveSession(name);
    }
  }

  private showError(message: string): void {
    this.showNotification(message, 'error');
  }

  private showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }

  private showNotification(message: string, type: 'error' | 'success' | 'info' = 'info'): void {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    const colors = {
      error: '#dc3545',
      success: '#28a745',
      info: '#007bff'
    };

    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);

    // Click to dismiss
    notification.addEventListener('click', () => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    });
  }

  // Cleanup
  destroy(): void {
    this.canvasComponent?.destroy();
    this.databaseService.close();
    this.loadedImageAssets.clear();
    this.isInitialized = false;
  }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const app = new PinButtonApp();
    await app.initialize();

    // Make app available globally for debugging
    (window as any).pinButtonApp = app;

  } catch (error) {
    console.error('Failed to start application:', error);
    document.body.innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
        <h1 style="color: #dc3545;">Application Error</h1>
        <p>Failed to initialize Pin Button Layout Designer.</p>
        <p style="color: #666; font-size: 14px;">Please check the console for details and refresh the page.</p>
      </div>
    `;
  }
});