/**
 * Response Builder
 * Handles HTTP response creation with consistent formatting
 */

import { HTTP_STATUS, CONTENT_TYPES, CORS_HEADERS } from "./constants";

/**
 * Response Builder (Single Responsibility: Response Creation)
 */
export class ResponseBuilder {
  static success(data: unknown, status: number = HTTP_STATUS.OK): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": CONTENT_TYPES.JSON,
        ...CORS_HEADERS,
      },
    });
  }

  static error(message: string, status: number): Response {
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: {
        "Content-Type": CONTENT_TYPES.JSON,
        ...CORS_HEADERS,
      },
    });
  }

  static cors(): Response {
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

  static file(
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
}

