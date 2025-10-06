/**
 * Storage Adapter Interface Contract
 *
 * Defines the contract for persistent storage mechanisms.
 * Implementations must handle JSON serialization, error handling,
 * and maintain data integrity.
 */

export interface StorageAdapter<T> {
  /**
   * Retrieve value by key
   *
   * @param key - Storage key (must be non-empty string)
   * @returns Stored value or null if not found
   * @throws Error if deserialization fails
   */
  get(key: string): T | null;

  /**
   * Store value by key
   *
   * @param key - Storage key (must be non-empty string)
   * @param value - Value to store (must be JSON-serializable)
   * @throws Error if serialization fails
   * @throws QuotaExceededError if storage quota exceeded
   */
  set(key: string, value: T): void;

  /**
   * Delete value by key
   *
   * @param key - Storage key (must be non-empty string)
   * @returns true if deleted, false if key didn't exist
   */
  delete(key: string): boolean;

  /**
   * List all storage keys
   *
   * @returns Array of all keys in storage
   */
  keys(): string[];

  /**
   * Clear all values from storage
   *
   * @warning This is a destructive operation
   */
  clear(): void;

  /**
   * Check if key exists
   *
   * @param key - Storage key to check
   * @returns true if key exists, false otherwise
   */
  has(key: string): boolean;
}

/**
 * localStorage Implementation Contract
 *
 * Expected behavior:
 * - Uses browser's localStorage API
 * - Prefixes all keys with namespace (e.g., 'session:')
 * - Serializes values to JSON strings
 * - Deserializes JSON strings back to typed objects
 * - Handles Date objects correctly (ISO 8601 strings)
 * - Catches and re-throws QuotaExceededError with user-friendly message
 * - Validates data structure on retrieval
 * - Returns null for missing or corrupted data
 */

/**
 * Test Contract:
 *
 * Unit Tests Required:
 * ✅ get() returns stored value
 * ✅ get() returns null for missing key
 * ✅ set() stores value successfully
 * ✅ set() throws QuotaExceededError when quota exceeded
 * ✅ set() throws Error for non-serializable values
 * ✅ delete() removes value and returns true
 * ✅ delete() returns false for non-existent key
 * ✅ keys() returns all storage keys
 * ✅ clear() removes all values
 * ✅ has() returns true for existing key
 * ✅ has() returns false for missing key
 * ✅ Date serialization/deserialization works correctly
 * ✅ Malformed JSON handled gracefully
 * ✅ Key prefixing prevents collisions
 */

/**
 * Integration Test Contract:
 *
 * ✅ Store session, refresh page, verify persistence
 * ✅ Update session, verify changes persisted
 * ✅ Delete session, verify removal
 * ✅ Multiple sessions stored independently
 * ✅ Quota exceeded displays user-friendly error
 */

/**
 * Usage Example:
 *
 * ```typescript
 * const storage = new LocalStorageAdapter<SessionData>('session');
 *
 * // Store session
 * storage.set('abc-123', {
 *   id: 'abc-123',
 *   name: 'My Layout',
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   buttonAreas: []
 * });
 *
 * // Retrieve session
 * const session = storage.get('abc-123');
 *
 * // List all sessions
 * const sessionIds = storage.keys();
 *
 * // Delete session
 * storage.delete('abc-123');
 * ```
 */

/**
 * Error Handling Contract:
 *
 * - QuotaExceededError: Caught and re-thrown with message
 *   "Storage quota exceeded. Please delete old sessions."
 *
 * - JSON SyntaxError: Caught and logged, returns null
 *
 * - Missing key: Returns null (not an error)
 *
 * - Invalid key (empty string): Throws Error
 *   "Storage key must be non-empty string"
 */
