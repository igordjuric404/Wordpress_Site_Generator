import crypto from 'crypto';

/**
 * Sanitize a string for use as a database name
 * - Lowercase
 * - Replace non-alphanumeric with underscores
 * - Max 64 characters (MySQL limit)
 */
export function sanitizeDbName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 64);
}

/**
 * Create a URL-safe slug from a business name
 * - Lowercase
 * - Replace spaces with hyphens
 * - Remove special characters
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Generate a secure random password
 */
export function generatePassword(length: number = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

/**
 * Extract city from an address string
 */
export function extractCity(address: string): string {
  if (!address) return 'your city';
  
  // Simple extraction - take the second-to-last comma-separated part
  const parts = address.split(',').map((p) => p.trim());
  if (parts.length >= 2) {
    // Try to get city from "City, State ZIP" format
    const cityStatePart = parts[parts.length - 2];
    return cityStatePart.split(/\s+/)[0] || 'your city';
  }
  return parts[0] || 'your city';
}
