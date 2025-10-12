import { Session, SessionData } from '@/models/Session';
import { ButtonArea, ButtonAreaData } from '@/models/ButtonArea';
import { ImageAsset, ImageAssetData } from '@/models/ImageAsset';
import { PrintConfiguration, PrintConfigurationData } from '@/models/PrintConfiguration';
import { LocalStorageAdapter } from '@/utils/storage';

interface DatabaseServiceInterface {
  // Session Management
  createSession(session: Omit<SessionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<SessionData>;
  getSession(id: string): Promise<SessionData | null>;
  updateSession(id: string, updates: Partial<SessionData>): Promise<SessionData>;
  deleteSession(id: string): Promise<boolean>;
  listSessions(includeTemporary?: boolean): Promise<SessionData[]>;

  // Button Area Management
  createButtonArea(buttonArea: Omit<ButtonAreaData, 'id'>): Promise<ButtonAreaData>;
  getButtonArea(id: string): Promise<ButtonAreaData | null>;
  updateButtonArea(id: string, updates: Partial<ButtonAreaData>): Promise<ButtonAreaData>;
  deleteButtonArea(id: string): Promise<boolean>;
  getButtonAreasBySession(sessionId: string): Promise<ButtonAreaData[]>;

  // Image Asset Management
  createImageAsset(imageAsset: Omit<ImageAssetData, 'id' | 'uploadedAt' | 'lastUsedAt'>): Promise<ImageAssetData>;
  getImageAsset(id: string): Promise<ImageAssetData | null>;
  updateImageAsset(id: string, updates: Partial<ImageAssetData>): Promise<ImageAssetData>;
  deleteImageAsset(id: string): Promise<boolean>;
  getImageAssetsByUsage(limit?: number): Promise<ImageAssetData[]>;
  cleanupUnusedImages(olderThanDays: number): Promise<number>;

  // Print Configuration Management
  createPrintConfig(config: Omit<PrintConfigurationData, 'id' | 'createdAt'>): Promise<PrintConfigurationData>;
  getPrintConfig(id: string): Promise<PrintConfigurationData | null>;
  getLatestPrintConfigForSession(sessionId: string): Promise<PrintConfigurationData | null>;

  // Database Maintenance
  initialize(): Promise<void>;
  close(): Promise<void>;
  backup(filePath: string): Promise<boolean>;
  restore(filePath: string): Promise<boolean>;
}

export class DatabaseService implements DatabaseServiceInterface {
  // localStorage-backed storage for sessions (persists across page refreshes)
  private sessionStorage: LocalStorageAdapter<SessionData>;
  // localStorage-backed storage for image assets (persists across page refreshes)
  private imageAssetStorage: LocalStorageAdapter<ImageAssetData>;
  // localStorage-backed storage for button areas (persists across page refreshes)
  private buttonAreaStorage: LocalStorageAdapter<ButtonAreaData>;
  // In-memory storage for other entities
  private printConfigs: Map<string, PrintConfigurationData> = new Map();

  constructor() {
    this.sessionStorage = new LocalStorageAdapter<SessionData>('session');
    this.imageAssetStorage = new LocalStorageAdapter<ImageAssetData>('imageAsset');
    this.buttonAreaStorage = new LocalStorageAdapter<ButtonAreaData>('buttonArea');
  }

  async initialize(): Promise<void> {
    // localStorage adapter is ready to use immediately
  }

  async close(): Promise<void> {
    // No-op for in-memory storage
  }

  // Session Management
  async createSession(sessionData: Omit<SessionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<SessionData> {
    const session = new Session(sessionData);
    const data = session.toData();

    try {
      this.sessionStorage.set(data.id, data);
    } catch (error: any) {
      if (error.message && error.message.includes('Storage quota exceeded')) {
        console.error('Storage quota exceeded:', error);
        throw new Error('Storage quota exceeded. Please delete old sessions to free up space.');
      }
      throw error;
    }

    return data;
  }

  async getSession(id: string): Promise<SessionData | null> {
    return this.sessionStorage.get(id);
  }

  async updateSession(id: string, updates: Partial<SessionData>): Promise<SessionData> {
    const existing = this.sessionStorage.get(id);
    if (!existing) {
      throw new Error(`Session ${id} not found`);
    }

    const updated = { ...existing, ...updates, updatedAt: new Date() };
    Session.fromData(updated); // Validate the data

    try {
      this.sessionStorage.set(id, updated);
    } catch (error: any) {
      if (error.message && error.message.includes('Storage quota exceeded')) {
        console.error('Storage quota exceeded:', error);
        throw new Error('Storage quota exceeded. Please delete old sessions to free up space.');
      }
      throw error;
    }

    return updated;
  }

  async deleteSession(id: string): Promise<boolean> {
    const existed = this.sessionStorage.has(id);
    this.sessionStorage.delete(id);

    // Also delete associated button areas
    const buttonAreaKeys = this.buttonAreaStorage.keys();
    for (const buttonId of buttonAreaKeys) {
      const buttonArea = this.buttonAreaStorage.get(buttonId);
      if (buttonArea && buttonArea.sessionId === id) {
        this.buttonAreaStorage.delete(buttonId);
      }
    }

    return existed;
  }

  async listSessions(includeTemporary = false): Promise<SessionData[]> {
    const sessionIds = this.sessionStorage.keys();
    const sessions: SessionData[] = [];

    for (const id of sessionIds) {
      const session = this.sessionStorage.get(id);
      if (session) {
        sessions.push(session);
      }
    }

    if (includeTemporary) {
      return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    return sessions
      .filter(s => !s.isTemporary)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  // Button Area Management
  async createButtonArea(buttonAreaData: Omit<ButtonAreaData, 'id'>): Promise<ButtonAreaData> {
    const buttonArea = new ButtonArea(buttonAreaData);
    const data = buttonArea.toData();
    this.buttonAreaStorage.set(data.id, data);
    return data;
  }

  async getButtonArea(id: string): Promise<ButtonAreaData | null> {
    return this.buttonAreaStorage.get(id);
  }

  async updateButtonArea(id: string, updates: Partial<ButtonAreaData>): Promise<ButtonAreaData> {
    const existing = this.buttonAreaStorage.get(id);
    if (!existing) {
      throw new Error(`ButtonArea ${id} not found`);
    }

    const updated = { ...existing, ...updates };
    ButtonArea.fromData(updated); // Validate the data
    this.buttonAreaStorage.set(id, updated);
    return updated;
  }

  async deleteButtonArea(id: string): Promise<boolean> {
    return this.buttonAreaStorage.delete(id);
  }

  async getButtonAreasBySession(sessionId: string): Promise<ButtonAreaData[]> {
    const allKeys = this.buttonAreaStorage.keys();
    const buttonAreas: ButtonAreaData[] = [];
    
    for (const key of allKeys) {
      const buttonArea = this.buttonAreaStorage.get(key);
      if (buttonArea && buttonArea.sessionId === sessionId) {
        buttonAreas.push(buttonArea);
      }
    }
    
    return buttonAreas.sort((a, b) => a.y - b.y || a.x - b.x);
  }

  // Image Asset Management
  async createImageAsset(imageData: Omit<ImageAssetData, 'id' | 'uploadedAt' | 'lastUsedAt'>): Promise<ImageAssetData> {
    const imageAsset = new ImageAsset(imageData);
    const data = imageAsset.toData();
    this.imageAssetStorage.set(data.id, data);
    return data;
  }

  async getImageAsset(id: string): Promise<ImageAssetData | null> {
    return this.imageAssetStorage.get(id);
  }

  async updateImageAsset(id: string, updates: Partial<ImageAssetData>): Promise<ImageAssetData> {
    const existing = this.imageAssetStorage.get(id);
    if (!existing) {
      throw new Error(`ImageAsset ${id} not found`);
    }

    const updated = { ...existing, ...updates };
    this.imageAssetStorage.set(id, updated);
    return updated;
  }

  async deleteImageAsset(id: string): Promise<boolean> {
    return this.imageAssetStorage.delete(id);
  }

  async getImageAssetsByUsage(limit = 50): Promise<ImageAssetData[]> {
    const allKeys = this.imageAssetStorage.keys();
    const imageAssets: ImageAssetData[] = [];
    
    for (const key of allKeys) {
      const imageAsset = this.imageAssetStorage.get(key);
      if (imageAsset) {
        imageAssets.push(imageAsset);
      }
    }
    
    return imageAssets
      .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime())
      .slice(0, limit);
  }

  async cleanupUnusedImages(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    // Get all button areas to find used image IDs
    const buttonAreaKeys = this.buttonAreaStorage.keys();
    const usedImageIds = new Set<string>();
    
    for (const key of buttonAreaKeys) {
      const buttonArea = this.buttonAreaStorage.get(key);
      if (buttonArea?.imageAssetId) {
        usedImageIds.add(buttonArea.imageAssetId);
      }
    }

    // Delete unused images
    let deletedCount = 0;
    const imageKeys = this.imageAssetStorage.keys();
    
    for (const id of imageKeys) {
      const asset = this.imageAssetStorage.get(id);
      if (asset && !usedImageIds.has(id) && asset.lastUsedAt < cutoffDate) {
        this.imageAssetStorage.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // Print Configuration Management
  async createPrintConfig(configData: Omit<PrintConfigurationData, 'id' | 'createdAt'>): Promise<PrintConfigurationData> {
    const printConfig = new PrintConfiguration(configData);
    const data = printConfig.toData();
    this.printConfigs.set(data.id, data);
    return data;
  }

  async getPrintConfig(id: string): Promise<PrintConfigurationData | null> {
    return this.printConfigs.get(id) || null;
  }

  async getLatestPrintConfigForSession(sessionId: string): Promise<PrintConfigurationData | null> {
    const configs = Array.from(this.printConfigs.values())
      .filter(config => config.sessionId === sessionId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return configs[0] || null;
  }

  async backup(_filePath: string): Promise<boolean> {
    try {
      // Sessions, buttonAreas, and imageAssets are already in localStorage
      // For print configs, save to backup storage
      const data = {
        printConfigs: Array.from(this.printConfigs.entries())
      };

      localStorage.setItem('pin-button-backup', JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Backup failed:', error);
      return false;
    }
  }

  async restore(_filePath: string): Promise<boolean> {
    try {
      const backupData = localStorage.getItem('pin-button-backup');
      if (!backupData) return false;

      const data = JSON.parse(backupData);
      // Sessions, buttonAreas, and imageAssets are restored from localStorage automatically
      this.printConfigs = new Map(data.printConfigs);

      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }
}