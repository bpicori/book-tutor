/**
 * Shared constants
 */

export const HTTP_STATUS = {
  OK: 200,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const CONTENT_TYPES = {
  JSON: "application/json",
  GZIP: "application/gzip",
} as const;

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
} as const;

export const BACKUP_PATHS = {
  BASE: "/backup",
} as const;

