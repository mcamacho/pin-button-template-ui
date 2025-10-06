import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageAdapter, LocalStorageAdapter } from '@/utils/storage';

describe('StorageAdapter - get() and set()', () => {
  let storage: StorageAdapter<any>;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    mockLocalStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
      get length() {
        return Object.keys(store).length;
      }
    };

    // Replace global localStorage with mock
    global.localStorage = mockLocalStorage;

    storage = new LocalStorageAdapter('session');
  });

  it('should store value successfully with set()', () => {
    const testData = { id: '123', name: 'Test Session' };

    storage.set('test-key', testData);

    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('should retrieve stored value with get()', () => {
    const testData = { id: '123', name: 'Test Session' };

    storage.set('test-key', testData);
    const retrieved = storage.get('test-key');

    expect(retrieved).toEqual(testData);
  });

  it('should return null for missing key', () => {
    const result = storage.get('non-existent-key');

    expect(result).toBeNull();
  });

  it('should serialize and deserialize Date objects correctly', () => {
    const testDate = new Date('2025-10-06T10:00:00.000Z');
    const testData = {
      id: '123',
      createdAt: testDate,
      updatedAt: testDate
    };

    storage.set('date-test', testData);
    const retrieved = storage.get('date-test');

    expect(retrieved).not.toBeNull();
    expect(retrieved.createdAt).toBeInstanceOf(Date);
    expect(retrieved.updatedAt).toBeInstanceOf(Date);
    expect(retrieved.createdAt.toISOString()).toBe(testDate.toISOString());
  });

  it('should properly JSON serialize values', () => {
    const testData = {
      id: '123',
      nested: { value: 42, array: [1, 2, 3] }
    };

    storage.set('json-test', testData);
    const retrieved = storage.get('json-test');

    expect(retrieved).toEqual(testData);
  });
});

describe('StorageAdapter - error handling', () => {
  let storage: StorageAdapter<any>;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    const store: Record<string, string> = {};
    mockLocalStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
      get length() {
        return Object.keys(store).length;
      }
    };

    global.localStorage = mockLocalStorage;
    storage = new LocalStorageAdapter('session');
  });

  it('should throw user-friendly error when quota exceeded', () => {
    // Mock QuotaExceededError
    mockLocalStorage.setItem = vi.fn(() => {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    });

    expect(() => {
      storage.set('test-key', { data: 'large data' });
    }).toThrow(/Storage quota exceeded|delete old sessions/i);
  });

  it('should handle malformed JSON gracefully', () => {
    // Inject malformed JSON directly into mock storage
    mockLocalStorage.getItem = vi.fn(() => '{invalid json}');

    const result = storage.get('malformed-key');

    expect(result).toBeNull();
  });

  it('should return true when deleting existing key', () => {
    storage.set('test-key', { id: '123' });

    const result = storage.delete('test-key');

    expect(result).toBe(true);
    expect(storage.get('test-key')).toBeNull();
  });

  it('should return false when deleting non-existent key', () => {
    const result = storage.delete('non-existent-key');

    expect(result).toBe(false);
  });

  it('should return correct boolean for has()', () => {
    expect(storage.has('test-key')).toBe(false);

    storage.set('test-key', { id: '123' });

    expect(storage.has('test-key')).toBe(true);
  });

  it('should remove all values with clear()', () => {
    storage.set('key1', { id: '1' });
    storage.set('key2', { id: '2' });

    storage.clear();

    expect(storage.get('key1')).toBeNull();
    expect(storage.get('key2')).toBeNull();
    expect(storage.keys()).toHaveLength(0);
  });
});

describe('StorageAdapter - keys() and filtering', () => {
  let storage: StorageAdapter<any>;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    const store: Record<string, string> = {};
    mockLocalStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(key => delete store[key]);
      }),
      key: vi.fn((index: number) => Object.keys(store)[index] || null),
      get length() {
        return Object.keys(store).length;
      }
    };

    global.localStorage = mockLocalStorage;
    storage = new LocalStorageAdapter('session');
  });

  it('should return all storage keys', () => {
    storage.set('key1', { id: '1' });
    storage.set('key2', { id: '2' });
    storage.set('key3', { id: '3' });

    const keys = storage.keys();

    expect(keys).toHaveLength(3);
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
    expect(keys).toContain('key3');
  });

  it('should prefix keys to prevent collisions', () => {
    storage.set('test-id', { id: '123' });

    // The actual localStorage key should have the prefix
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      expect.stringContaining('session:'),
      expect.any(String)
    );
  });

  it('should store multiple keys independently', () => {
    const data1 = { id: '1', name: 'First' };
    const data2 = { id: '2', name: 'Second' };

    storage.set('key1', data1);
    storage.set('key2', data2);

    expect(storage.get('key1')).toEqual(data1);
    expect(storage.get('key2')).toEqual(data2);

    // Modifying one shouldn't affect the other
    storage.set('key1', { id: '1', name: 'Modified' });
    expect(storage.get('key2')).toEqual(data2);
  });

  it('should throw error for empty string key', () => {
    expect(() => {
      storage.set('', { id: '123' });
    }).toThrow(/key must be non-empty/i);
  });
});
