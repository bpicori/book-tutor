/**
 * Cloudflare Worker API for syncing book backups
 * Uses Basic Auth and R2 storage
 */

interface Env {
  BACKUPS: R2Bucket;
  AUTH_USERNAME: string;
  AUTH_PASSWORD: string;
}

interface BackupData {
  version: number;
  exportedAt: string;
  localStorage: Record<string, unknown>;
  bookFiles: Array<{
    id: string;
    data: string; // Base64 encoded
  }>;
}

/**
 * Parse Basic Auth header
 */
function parseBasicAuth(request: Request): { username: string; password: string } | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return null;
  }

  try {
    const base64 = authHeader.substring(6);
    const decoded = atob(base64);
    const [username, password] = decoded.split(":", 2);
    return { username, password };
  } catch {
    return null;
  }
}

/**
 * Validate Basic Auth credentials
 */
function validateAuth(request: Request, env: Env): boolean {
  const credentials = parseBasicAuth(request);
  if (!credentials) {
    return false;
  }

  return (
    credentials.username === env.AUTH_USERNAME &&
    credentials.password === env.AUTH_PASSWORD
  );
}

/**
 * Create error response
 */
function errorResponse(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

/**
 * Handle CORS preflight
 */
function handleCORS(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  return null;
}

/**
 * Upload backup to R2
 */
async function handleUpload(request: Request, env: Env): Promise<Response> {
  if (!validateAuth(request, env)) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const backupData: BackupData = await request.json();

    // Validate backup structure
    if (
      !backupData.version ||
      !backupData.exportedAt ||
      !backupData.localStorage ||
      !Array.isArray(backupData.bookFiles)
    ) {
      return errorResponse("Invalid backup format", 400);
    }

    // Get username from auth
    const credentials = parseBasicAuth(request);
    if (!credentials) {
      return errorResponse("Invalid credentials", 401);
    }

    const key = `backups/${credentials.username}.json`;

    // Store in R2
    await env.BACKUPS.put(key, JSON.stringify(backupData), {
      httpMetadata: {
        contentType: "application/json",
      },
      customMetadata: {
        exportedAt: backupData.exportedAt,
        version: String(backupData.version),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Backup uploaded successfully",
        exportedAt: backupData.exportedAt,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to upload backup",
      500
    );
  }
}

/**
 * Download backup from R2
 */
async function handleDownload(request: Request, env: Env): Promise<Response> {
  if (!validateAuth(request, env)) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const credentials = parseBasicAuth(request);
    if (!credentials) {
      return errorResponse("Invalid credentials", 401);
    }

    const key = `backups/${credentials.username}.json`;
    const object = await env.BACKUPS.get(key);

    if (!object) {
      return errorResponse("Backup not found", 404);
    }

    const backupData = await object.json<BackupData>();

    return new Response(JSON.stringify(backupData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to download backup",
      500
    );
  }
}

/**
 * Delete backup from R2
 */
async function handleDelete(request: Request, env: Env): Promise<Response> {
  if (!validateAuth(request, env)) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const credentials = parseBasicAuth(request);
    if (!credentials) {
      return errorResponse("Invalid credentials", 401);
    }

    const key = `backups/${credentials.username}.json`;
    await env.BACKUPS.delete(key);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Backup deleted successfully",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Delete error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to delete backup",
      500
    );
  }
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    const corsResponse = handleCORS(request);
    if (corsResponse) {
      return corsResponse;
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Route handling
    if (path === "/backup" || path === "/backup/") {
      switch (request.method) {
        case "POST":
          return handleUpload(request, env);
        case "GET":
          return handleDownload(request, env);
        case "DELETE":
          return handleDelete(request, env);
        default:
          return errorResponse("Method not allowed", 405);
      }
    }

    return errorResponse("Not found", 404);
  },
};

