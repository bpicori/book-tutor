/**
 * Authentication Service
 * Handles Basic Auth parsing and validation
 */

export interface Env {
  BACKUPS: R2Bucket;
  AUTH_USERNAME: string;
  AUTH_PASSWORD: string;
}

export interface Credentials {
  username: string;
  password: string;
}

/**
 * Parse Basic Auth header from request
 */
export function parseCredentials(request: Request): Credentials | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return null;
  }

  try {
    const base64 = authHeader.substring(6);
    const decoded = atob(base64);
    const [username, password] = decoded.split(":", 2);

    if (!username || !password) {
      return null;
    }

    return { username, password };
  } catch {
    return null;
  }
}

/**
 * Validate credentials against environment variables
 */
export function validateAuth(request: Request, env: Env): boolean {
  const credentials = parseCredentials(request);
  if (!credentials) {
    return false;
  }

  return (
    credentials.username === env.AUTH_USERNAME &&
    credentials.password === env.AUTH_PASSWORD
  );
}

/**
 * Get username from authenticated request
 * Throws if authentication fails
 */
export function getUsername(request: Request): string {
  const credentials = parseCredentials(request);
  if (!credentials) {
    throw new Error("Invalid credentials");
  }
  return credentials.username;
}
