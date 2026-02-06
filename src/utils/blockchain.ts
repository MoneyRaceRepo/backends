/**
 * Blockchain utility functions
 * Helper functions for common blockchain operations
 */

import { DEFAULT_PACKAGE_ID, MOVE_EVENT_TYPES } from '../constants/index.js';
import { config } from '../config/index.js';

/**
 * Get the package ID for the Money Race smart contract
 * Prioritizes environment variable, falls back to default
 *
 * @returns Package ID string
 */
export function getPackageId(): string {
  return config.packageId || DEFAULT_PACKAGE_ID;
}

/**
 * Build full Move event type string with package ID
 *
 * @param eventType - Event type from MOVE_EVENT_TYPES constant
 * @returns Full event type string in format: "{packageId}::{eventType}"
 *
 * @example
 * ```ts
 * buildEventType(MOVE_EVENT_TYPES.PLAYER_JOINED)
 * // Returns: "0xabc...::money_race_v2::PlayerJoined"
 * ```
 */
export function buildEventType(eventType: string): string {
  const packageId = getPackageId();
  return `${packageId}::${eventType}`;
}

/**
 * Get all common Move event types for Money Race contract
 *
 * @returns Object containing all event types with package ID prepended
 */
export function getEventTypes() {
  return {
    PLAYER_JOINED: buildEventType(MOVE_EVENT_TYPES.PLAYER_JOINED),
    DEPOSIT_MADE: buildEventType(MOVE_EVENT_TYPES.DEPOSIT_MADE),
    ROOM_CREATED: buildEventType(MOVE_EVENT_TYPES.ROOM_CREATED),
    ROOM_STARTED: buildEventType(MOVE_EVENT_TYPES.ROOM_STARTED),
    ROOM_FINALIZED: buildEventType(MOVE_EVENT_TYPES.ROOM_FINALIZED),
  };
}

/**
 * Convert USDC amount from base units to human-readable format
 *
 * @param amountInUnits - Amount in base units (with decimals)
 * @param decimals - Number of decimal places (default: 6 for USDC)
 * @returns Amount in human-readable format
 *
 * @example
 * ```ts
 * fromUnits(1_000_000, 6) // Returns: 1
 * fromUnits(500_000, 6)   // Returns: 0.5
 * ```
 */
export function fromUnits(amountInUnits: number, decimals: number = 6): number {
  return amountInUnits / Math.pow(10, decimals);
}

/**
 * Convert USDC amount from human-readable format to base units
 *
 * @param amount - Amount in human-readable format
 * @param decimals - Number of decimal places (default: 6 for USDC)
 * @returns Amount in base units
 *
 * @example
 * ```ts
 * toUnits(1, 6)   // Returns: 1_000_000
 * toUnits(0.5, 6) // Returns: 500_000
 * ```
 */
export function toUnits(amount: number, decimals: number = 6): number {
  return amount * Math.pow(10, decimals);
}

/**
 * Calculate elapsed time in years from milliseconds
 * Useful for APY/yield calculations
 *
 * @param elapsedMs - Elapsed time in milliseconds
 * @returns Elapsed time in years (fractional)
 *
 * @example
 * ```ts
 * msToYears(365.25 * 24 * 60 * 60 * 1000) // Returns: 1
 * msToYears(182.625 * 24 * 60 * 60 * 1000) // Returns: 0.5
 * ```
 */
export function msToYears(elapsedMs: number): number {
  const MILLISECONDS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
  return elapsedMs / MILLISECONDS_PER_YEAR;
}
