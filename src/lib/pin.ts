import crypto from 'crypto';

/**
 * PIN utilities — shared between "create event" and future "reset PIN" flows.
 */

/** Generates a cryptographically random 6-digit PIN (100000–999999). */
export function generatePin(): string {
  // Use crypto.randomInt for uniform distribution, no modulo bias.
  return String(crypto.randomInt(100000, 1000000));
}

/**
 * Hashes a PIN using scrypt with a random salt.
 * Storage format: `<hex-salt>:<hex-hash>`
 *
 * Verification (future use):
 *   const [salt, storedHash] = pinHash.split(':');
 *   const hash = crypto.scryptSync(pin, salt, 64).toString('hex');
 *   return hash === storedHash;
 */
export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pin, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a given PIN against a stored PIN hash.
 * @param pin The plain-text PIN provided by the user.
 * @param storedPinHash The hashed PIN stored in the database.
 * @returns true if the PIN is valid, false otherwise.
 */
export function verifyPin(pin: string, storedPinHash: string): boolean {
  try {
    const [salt, storedHash] = storedPinHash.split(':');
    if (!salt || !storedHash) return false;
    const hash = crypto.scryptSync(pin, salt, 64).toString('hex');
    // Using crypto.timingSafeEqual for security against timing attacks
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
  } catch {
    return false;
  }
}
