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
