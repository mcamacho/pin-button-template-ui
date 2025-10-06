/**
 * Storage Adapter Interface
 *
 * Defines the contract for persistent storage mechanisms.
 */
export interface StorageAdapter<T> {
  /**
   * Retrieve value by key
   * @param key - Storage key (must be non-empty string)
   * @returns Stored value or null if not found
   */
  get(key: string): T | null;

  /**
   * Store value by key
   * @param key - Storage key (must be non-empty string)
   * @param value - Value to store (must be JSON-serializable)
   * @throws Error if serialization fails or quota exceeded
   */
  set(key: string, value: T): void;

  /**
   * Delete value by key
   * @param key - Storage key (must be non-empty string)
   * @returns true if deleted, false if key didn't exist
   */
  delete(key: string): boolean;

  /**
   * Check if key exists
   * @param key - Storage key to check
   * @returns true if key exists, false otherwise
   */
  has(key: string): boolean;

  /**
   * List all storage keys (without namespace prefix)
   * @returns Array of all keys in storage
   */
  keys(): string[];

  /**
   * Clear all values from storage
   * @warning This is a destructive operation
   */
  clear(): void;
}

/**
 * Date serialization helpers for localStorage
 */
function serializeValue(value: unknown): string {
  return JSON.stringify(value, (_key, val) => {
    // Convert Date objects to ISO strings
    if (val instanceof Date) {
      return val.toISOString();
    }
    return val;
  });
}

function deserializeValue<T>(json: string): T {
  return JSON.parse(json, (_key, val) => {
    // Convert ISO date strings back to Date objects
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(val)) {
      return new Date(val);
    }
    return val;
  });
}

/**
 * localStorage Implementation of StorageAdapter
 *
 * Provides persistent storage using browser's localStorage API.
 * All keys are prefixed with a namespace to prevent collisions.
 */
export class LocalStorageAdapter<T> implements StorageAdapter<T> {
  private namespace: string;

  constructor(namespace: string) {
    if (!namespace || namespace.trim() === '') {
      throw new Error('Storage namespace must be non-empty string');
    }
    this.namespace = namespace;
  }

  /**
   * Get the prefixed key for localStorage
   */
  private getPrefixedKey(key: string): string {
    this.validateKey(key);
    return `${this.namespace}:${key}`;
  }

  /**
   * Validate that key is non-empty
   */
  private validateKey(key: string): void {
    if (!key || key.trim() === '') {
      throw new Error('Storage key must be non-empty string');
    }
  }

  get(key: string): T | null {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const item = localStorage.getItem(prefixedKey);

      if (item === null) {
        return null;
      }

      return deserializeValue<T>(item);
    } catch (error) {
      // Handle malformed JSON
      console.warn(`Failed to deserialize value for key "${key}":`, error);
      return null;
    }
  }

  set(key: string, value: T): void {
    try {
      const prefixedKey = this.getPrefixedKey(key);
      const serialized = serializeValue(value);
      localStorage.setItem(prefixedKey, serialized);
    } catch (error: any) {
      if (error.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please delete old sessions to free up space.');
      }
      throw error;
    }
  }

  delete(key: string): boolean {
    const prefixedKey = this.getPrefixedKey(key);
    const existed = localStorage.getItem(prefixedKey) !== null;
    localStorage.removeItem(prefixedKey);
    return existed;
  }

  has(key: string): boolean {
    const prefixedKey = this.getPrefixedKey(key);
    return localStorage.getItem(prefixedKey) !== null;
  }

  keys(): string[] {
    const prefix = `${this.namespace}:`;
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        // Remove the prefix to return just the key
        keys.push(key.substring(prefix.length));
      }
    }

    return keys;
  }

  clear(): void {
    const keysToRemove = this.keys();
    keysToRemove.forEach(key => this.delete(key));
  }
}
