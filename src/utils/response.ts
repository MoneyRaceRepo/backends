/**
 * Standardized API response utilities
 * Ensures consistent response format across all endpoints
 */

import type { Response } from 'express';

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Send a successful response
 *
 * @param res - Express response object
 * @param data - Data to send in response
 * @param statusCode - HTTP status code (default: 200)
 *
 * @example
 * ```ts
 * sendSuccess(res, { rooms: [...] });
 * sendSuccess(res, { user }, 201);
 * ```
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Send an error response
 *
 * @param res - Express response object
 * @param error - Error message or Error object
 * @param statusCode - HTTP status code (default: 500)
 *
 * @example
 * ```ts
 * sendError(res, 'Room not found', 404);
 * sendError(res, new Error('Invalid input'), 400);
 * ```
 */
export function sendError(
  res: Response,
  error: string | Error,
  statusCode: number = 500
): Response {
  const errorMessage = error instanceof Error ? error.message : error;

  return res.status(statusCode).json({
    success: false,
    error: errorMessage,
  });
}

/**
 * Send a success response with a custom message
 *
 * @param res - Express response object
 * @param message - Success message
 * @param data - Optional data to include
 * @param statusCode - HTTP status code (default: 200)
 *
 * @example
 * ```ts
 * sendSuccessMessage(res, 'Room created successfully', { roomId: '123' }, 201);
 * ```
 */
export function sendSuccessMessage<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data && { data }),
  });
}

/**
 * Send a response for validation errors (400 Bad Request)
 *
 * @param res - Express response object
 * @param message - Validation error message
 *
 * @example
 * ```ts
 * sendValidationError(res, 'Room ID is required');
 * ```
 */
export function sendValidationError(res: Response, message: string): Response {
  return sendError(res, message, 400);
}

/**
 * Send a response for not found errors (404 Not Found)
 *
 * @param res - Express response object
 * @param resource - Resource that was not found
 *
 * @example
 * ```ts
 * sendNotFound(res, 'Room');
 * // Returns: { success: false, error: "Room not found" }
 * ```
 */
export function sendNotFound(res: Response, resource: string): Response {
  return sendError(res, `${resource} not found`, 404);
}

/**
 * Send a response for unauthorized access (401 Unauthorized)
 *
 * @param res - Express response object
 * @param message - Optional custom message
 *
 * @example
 * ```ts
 * sendUnauthorized(res);
 * sendUnauthorized(res, 'Invalid token');
 * ```
 */
export function sendUnauthorized(res: Response, message: string = 'Unauthorized'): Response {
  return sendError(res, message, 401);
}

/**
 * Send a response for forbidden access (403 Forbidden)
 *
 * @param res - Express response object
 * @param message - Optional custom message
 *
 * @example
 * ```ts
 * sendForbidden(res);
 * sendForbidden(res, 'You do not have permission to access this room');
 * ```
 */
export function sendForbidden(res: Response, message: string = 'Forbidden'): Response {
  return sendError(res, message, 403);
}
