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
        "Access-Control-Allow-Headers": "Authorization, Content-Type, Content-Encoding, Accept",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  return null;
}

/**
 * Decompress gzip-compressed data
 */
async function decompressData(compressedData: ArrayBuffer): Promise<string> {
  const stream = new DecompressionStream("gzip");
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  // Write compressed data to decompression stream
  writer.write(new Uint8Array(compressedData));
  writer.close();

  // Read decompressed chunks
  const chunks: Uint8Array[] = [];
  let done = false;
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      chunks.push(value);
    }
  }

  // Combine chunks and decode to string
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  const decoder = new TextDecoder();
  return decoder.decode(result);
}

/**
 * Compress data using gzip compression
 */
async function compressData(data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const stream = new CompressionStream("gzip");
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  // Write data to compression stream
  writer.write(encoder.encode(data));
  writer.close();

  // Read compressed chunks
  const chunks: Uint8Array[] = [];
  let done = false;
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      chunks.push(value);
    }
  }

  // Combine chunks into single ArrayBuffer
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}

/**
 * Upload backup to R2
 */
async function handleUpload(request: Request, env: Env): Promise<Response> {
  if (!validateAuth(request, env)) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    // Check if data is compressed (gzip)
    const contentType = request.headers.get("Content-Type");
    const isCompressed = contentType === "application/gzip";

    // Read request body once
    const requestBody = await request.arrayBuffer();
    
    let backupData: BackupData;
    let exportedAt: string;
    let version: number;
    let dataToStore: ArrayBuffer;

    if (isCompressed) {
      // Decompress the data to validate structure
      const jsonString = await decompressData(requestBody);
      backupData = JSON.parse(jsonString);
      // Use the original compressed data for storage
      dataToStore = requestBody;
    } else {
      // Legacy support: handle uncompressed JSON
      const jsonString = new TextDecoder().decode(requestBody);
      backupData = JSON.parse(jsonString);
      // Compress before storing
      dataToStore = await compressData(jsonString);
    }

    // Validate backup structure
    if (
      !backupData.version ||
      !backupData.exportedAt ||
      !backupData.localStorage ||
      !Array.isArray(backupData.bookFiles)
    ) {
      return errorResponse("Invalid backup format", 400);
    }

    exportedAt = backupData.exportedAt;
    version = backupData.version;

    // Get username from auth
    const credentials = parseBasicAuth(request);
    if (!credentials) {
      return errorResponse("Invalid credentials", 401);
    }

    const key = `backups/${credentials.username}.json.gz`;

    // Store compressed in R2
    await env.BACKUPS.put(key, dataToStore, {
      httpMetadata: {
        contentType: "application/gzip",
        contentEncoding: "gzip",
      },
      customMetadata: {
        exportedAt: exportedAt,
        version: String(version),
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Backup uploaded successfully",
        exportedAt: exportedAt,
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

    // Try compressed backup first, fallback to uncompressed for legacy backups
    let key = `backups/${credentials.username}.json.gz`;
    let object = await env.BACKUPS.get(key);

    // Fallback to uncompressed backup for backward compatibility
    if (!object) {
      key = `backups/${credentials.username}.json`;
      object = await env.BACKUPS.get(key);
    }

    if (!object) {
      return errorResponse("Backup not found", 404);
    }

    // Check if the stored object is compressed (by extension or content type)
    const isCompressed = key.endsWith(".gz") || 
                         object.httpMetadata?.contentEncoding === "gzip" ||
                         object.httpMetadata?.contentType === "application/gzip";

    if (isCompressed) {
      // Return compressed data directly (client will decompress)
      const compressedData = await object.arrayBuffer();
      return new Response(compressedData, {
        status: 200,
        headers: {
          "Content-Type": "application/gzip",
          "Content-Encoding": "gzip",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      });
    } else {
      // Legacy uncompressed backup - return as JSON
      const backupData = await object.json<BackupData>();
      return new Response(JSON.stringify(backupData), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      });
    }
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

    // Delete both compressed and uncompressed backups (for cleanup)
    const compressedKey = `backups/${credentials.username}.json.gz`;
    const uncompressedKey = `backups/${credentials.username}.json`;
    
    await Promise.all([
      env.BACKUPS.delete(compressedKey),
      env.BACKUPS.delete(uncompressedKey),
    ]);

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

