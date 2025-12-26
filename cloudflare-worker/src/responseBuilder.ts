/**
 * Response Builder
 * Handles HTTP response creation with consistent formatting
 */

import { HTTP_STATUS, CONTENT_TYPES, CORS_HEADERS } from "./constants";

/**
 * Create a successful JSON response
 */
export function createSuccessResponse(
  data: unknown,
  status: number = HTTP_STATUS.OK
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": CONTENT_TYPES.JSON,
      ...CORS_HEADERS,
    },
  });
}

/**
 * Create an error JSON response
 */
export function createErrorResponse(
  message: string,
  status: number
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": CONTENT_TYPES.JSON,
      ...CORS_HEADERS,
    },
  });
}

/**
 * Create a CORS preflight response
 */
export function createCorsResponse(): Response {
  return new Response(null, {
    status: HTTP_STATUS.NO_CONTENT,
    headers: {
      ...CORS_HEADERS,
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Authorization, Content-Type, Content-Encoding, Accept",
      "Access-Control-Max-Age": "86400",
    },
  });
}

/**
 * Create a file response with custom headers
 */
export function createFileResponse(
  data: ArrayBuffer,
  contentType: string,
  additionalHeaders: Record<string, string> = {}
): Response {
  return new Response(data, {
    status: HTTP_STATUS.OK,
    headers: {
      "Content-Type": contentType,
      ...CORS_HEADERS,
      ...additionalHeaders,
    },
  });
}
