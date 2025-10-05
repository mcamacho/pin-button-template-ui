/**
 * Database Service Contract
 * Defines the interface for SQLite database operations
 */

export interface DatabaseService {
  // Session Management
  createSession(session: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>): Promise<Session>;
  getSession(id: string): Promise<Session | null>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session>;
  deleteSession(id: string): Promise<boolean>;
  listSessions(includeTemporary?: boolean): Promise<Session[]>;

  // Button Area Management
  createButtonArea(buttonArea: Omit<ButtonArea, 'id'>): Promise<ButtonArea>;
  getButtonArea(id: string): Promise<ButtonArea | null>;
  updateButtonArea(id: string, updates: Partial<ButtonArea>): Promise<ButtonArea>;
  deleteButtonArea(id: string): Promise<boolean>;
  getButtonAreasBySession(sessionId: string): Promise<ButtonArea[]>;

  // Image Asset Management
  createImageAsset(imageAsset: Omit<ImageAsset, 'id' | 'uploadedAt' | 'lastUsedAt'>): Promise<ImageAsset>;
  getImageAsset(id: string): Promise<ImageAsset | null>;
  updateImageAsset(id: string, updates: Partial<ImageAsset>): Promise<ImageAsset>;
  deleteImageAsset(id: string): Promise<boolean>;
  getImageAssetsByUsage(limit?: number): Promise<ImageAsset[]>;
  cleanupUnusedImages(olderThanDays: number): Promise<number>;

  // Print Configuration Management
  createPrintConfig(config: Omit<PrintConfiguration, 'id' | 'createdAt'>): Promise<PrintConfiguration>;
  getPrintConfig(id: string): Promise<PrintConfiguration | null>;
  getLatestPrintConfigForSession(sessionId: string): Promise<PrintConfiguration | null>;

  // Database Maintenance
  initialize(): Promise<void>;
  close(): Promise<void>;
  backup(filePath: string): Promise<boolean>;
  restore(filePath: string): Promise<boolean>;
}

// Type definitions matching data-model.md
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