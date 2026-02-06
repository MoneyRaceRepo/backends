/**
 * Application-wide constants
 * Centralized location for magic numbers, hardcoded values, and configuration constants
 */

// ============================================================================
// BLOCKCHAIN CONSTANTS
// ============================================================================

/**
 * Default package ID for the Money Race smart contract
 * Used when PACKAGE_ID environment variable is not set
 */
export const DEFAULT_PACKAGE_ID = '0xaa90da2945b7b5dee82c73a535f0717724b0fa58643aba43972b8e8fbc67c280';

/**
 * USDC faucet package ID for minting test tokens
 */
export const USDC_FAUCET_ID = '0x6f101a733c447a22520807012911552c061a3f63a47129e949f5c2af448cc525';

/**
 * Sui Clock object ID (shared object for timestamp operations)
 */
export const CLOCK_ID = '0x6';

// ============================================================================
// TOKEN & DECIMALS
// ============================================================================

/**
 * USDC decimals (6 decimal places = 1,000,000)
 * Example: 1 USDC = 1_000_000 units
 */
export const USDC_DECIMALS = 1_000_000;

/**
 * Maximum USDC amount that can be minted per request (in USDC units)
 */
export const MAX_USDC_MINT = 1000;

/**
 * Maximum USDC amount in base units (with decimals applied)
 */
export const MAX_USDC_MINT_UNITS = MAX_USDC_MINT * USDC_DECIMALS;

// ============================================================================
// GAS & TRANSACTION LIMITS
// ============================================================================

/**
 * Gas budget for sponsored transactions (0.1 SUI in MIST)
 * 1 SUI = 1_000_000_000 MIST
 */
export const GAS_BUDGET = 100_000_000;

/**
 * Event query limits for different operations
 */
export const EVENT_QUERY_LIMITS = {
  PLAYER_JOINED: 50,
  DEPOSIT_MADE: 100,
  DEFAULT: 50,
} as const;

// ============================================================================
// TIME CONSTANTS
// ============================================================================

/**
 * Milliseconds in one year (accounting for leap years: 365.25 days)
 */
export const MILLISECONDS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Milliseconds in one week (default room period length)
 */
export const MILLISECONDS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Default period length for rooms in milliseconds (1 week)
 */
export const DEFAULT_PERIOD_LENGTH_MS = MILLISECONDS_PER_WEEK;

/**
 * Delay before auto-starting a room after creation (3 seconds)
 */
export const AUTO_START_DELAY_MS = 3000;

/**
 * JWKS cache max age in milliseconds (24 hours)
 */
export const JWKS_CACHE_MAX_AGE_MS = 86400000;

// ============================================================================
// MOVE EVENT TYPES
// ============================================================================

/**
 * Move event type names for the Money Race contract
 * Note: Package ID will be prepended at runtime
 */
export const MOVE_EVENT_TYPES = {
  PLAYER_JOINED: 'money_race_v2::PlayerJoined',
  DEPOSIT_MADE: 'money_race_v2::DepositMade',
  ROOM_CREATED: 'money_race_v2::RoomCreated',
  ROOM_STARTED: 'money_race_v2::RoomStarted',
  ROOM_FINALIZED: 'money_race_v2::RoomFinalized',
} as const;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

/**
 * Default values for room configuration
 */
export const ROOM_DEFAULTS = {
  PERIOD_LENGTH_MS: DEFAULT_PERIOD_LENGTH_MS,
  MIN_PARTICIPANTS: 2,
  AUTO_START_DELAY_MS: AUTO_START_DELAY_MS,
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type MoveEventType = typeof MOVE_EVENT_TYPES[keyof typeof MOVE_EVENT_TYPES];
