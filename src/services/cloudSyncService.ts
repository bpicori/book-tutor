import { buildBackupPayload } from "./backupData";
import { importBackup } from "./backupService";

export interface CloudSyncConfig {
  apiUrl: string;
  username: string;
  password: string;
}

interface CloudSyncResponse {
  success: boolean;
  message: string;
  exportedAt?: string;
  version?: number;
}

function createBasicAuth(username: string, password: string): string {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

async function compressData(data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  // eslint-disable-next-line no-undef
  const stream = new CompressionStream("gzip");
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  writer.write(encoder.encode(data));
  writer.close();

  const chunks: Uint8Array[] = [];
  let done = false;
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      chunks.push(value);
    }
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result.buffer;
}

async function decompressData(compressedData: ArrayBuffer): Promise<string> {
  // eslint-disable-next-line no-undef
  const stream = new DecompressionStream("gzip");
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();

  writer.write(new Uint8Array(compressedData));
  writer.close();

  const chunks: Uint8Array[] = [];
  let done = false;
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    done = readerDone;
    if (value) {
      chunks.push(value);
    }
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(result);
}

async function runCloudSync(
  action: () => Promise<CloudSyncResponse>
): Promise<CloudSyncResponse> {
  try {
    return await action();
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Cloud sync operation failed",
    };
  }
}

export async function uploadBackup(
  config: CloudSyncConfig
): Promise<CloudSyncResponse> {
  return runCloudSync(async () => {
    const backupData = await buildBackupPayload();
    const jsonString = JSON.stringify(backupData);
    const compressedData = await compressData(jsonString);

    const response = await fetch(`${config.apiUrl}/backup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/gzip",
        Authorization: createBasicAuth(config.username, config.password),
      },
      body: compressedData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || "Failed to upload backup");
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || "Backup uploaded successfully",
      exportedAt: result.exportedAt,
      version: backupData.version,
    };
  });
}

export async function downloadBackup(
  config: CloudSyncConfig
): Promise<CloudSyncResponse> {
  return runCloudSync(async () => {
    const response = await fetch(`${config.apiUrl}/backup`, {
      method: "GET",
      headers: {
        Authorization: createBasicAuth(config.username, config.password),
        Accept: "application/gzip",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          success: false,
          message: "No backup found in cloud",
        };
      }

      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || "Failed to download backup");
    }

    const compressedData = await response.arrayBuffer();
    const jsonString = await decompressData(compressedData);
    const backupData = JSON.parse(jsonString);

    if (
      !backupData.version ||
      !backupData.localStorage ||
      !Array.isArray(backupData.bookFiles)
    ) {
      throw new Error("Invalid backup format received from cloud");
    }

    const blob = new Blob([jsonString], { type: "application/json" });
    const file = new File([blob], "cloud-backup.json", {
      type: "application/json",
    });

    const importResult = await importBackup(file);
    if (!importResult.success) {
      return {
        success: false,
        message: importResult.message,
      };
    }

    return {
      success: true,
      message:
        importResult.message || "Backup downloaded and restored successfully",
      exportedAt: backupData.exportedAt,
      version: backupData.version,
    };
  });
}

export async function deleteBackup(
  config: CloudSyncConfig
): Promise<CloudSyncResponse> {
  return runCloudSync(async () => {
    const response = await fetch(`${config.apiUrl}/backup`, {
      method: "DELETE",
      headers: {
        Authorization: createBasicAuth(config.username, config.password),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(errorData.error || "Failed to delete backup");
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || "Backup deleted successfully",
    };
  });
}
