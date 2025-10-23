/**
 * ID Generation Utility
 * Centralized ID generation to avoid ESM issues with nanoid in Jest
 */

import { randomBytes } from 'crypto';

/**
 * Generate a unique ID (16 characters)
 */
export function generateId(): string {
  return randomBytes(8).toString('hex');
}

/**
 * Generate a short ID (8 characters)
 */
export function generateShortId(): string {
  return randomBytes(4).toString('hex');
}

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (randomBytes(1)[0] % 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
