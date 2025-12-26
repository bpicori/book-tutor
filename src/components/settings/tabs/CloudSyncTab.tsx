import { memo, useState, useCallback } from "react";
import { useStore } from "../../../store/useStore";
import {
  uploadBackup,
  downloadBackup,
  deleteBackup,
} from "../../../services/cloudSyncService";
import { Button } from "../../common";

export const CloudSyncTab = memo(function CloudSyncTab() {
  const { cloudSync, setCloudSyncEnabled, updateCloudSyncConfig, setLastSync } =
    useStore();

  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localApiUrl, setLocalApiUrl] = useState(cloudSync.config.apiUrl);
  const [localUsername, setLocalUsername] = useState(cloudSync.config.username);
  const [localPassword, setLocalPassword] = useState(cloudSync.config.password);

  const handleSaveConfig = useCallback(() => {
    updateCloudSyncConfig({
      apiUrl: localApiUrl.trim(),
      username: localUsername.trim(),
      password: localPassword,
    });
  }, [localApiUrl, localUsername, localPassword, updateCloudSyncConfig]);

  const handleUpload = useCallback(async () => {
    if (!cloudSync.config.apiUrl || !cloudSync.config.username || !cloudSync.config.password) {
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadBackup(cloudSync.config);
      const timestamp = result.success ? Date.now() : null;
      setLastSync(
        timestamp,
        result.success ? "success" : "error",
        result.message
      );
    } catch (error) {
      setLastSync(
        null,
        "error",
        error instanceof Error ? error.message : "Failed to upload backup"
      );
    } finally {
      setIsUploading(false);
    }
  }, [cloudSync.config, setLastSync]);

  const handleDownload = useCallback(async () => {
    if (!cloudSync.config.apiUrl || !cloudSync.config.username || !cloudSync.config.password) {
      return;
    }

    setIsDownloading(true);
    try {
      const result = await downloadBackup(cloudSync.config);
      const timestamp = result.success ? Date.now() : null;
      setLastSync(
        timestamp,
        result.success ? "success" : "error",
        result.message
      );

      if (result.success) {
        // Reload page to apply restored data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      setLastSync(
        null,
        "error",
        error instanceof Error ? error.message : "Failed to download backup"
      );
    } finally {
      setIsDownloading(false);
    }
  }, [cloudSync.config, setLastSync]);

  const handleDelete = useCallback(async () => {
    if (!cloudSync.config.apiUrl || !cloudSync.config.username || !cloudSync.config.password) {
      return;
    }

    if (!confirm("Are you sure you want to delete the backup from cloud?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteBackup(cloudSync.config);
      setLastSync(
        null,
        result.success ? "success" : "error",
        result.message
      );
    } catch (error) {
      setLastSync(
        null,
        "error",
        error instanceof Error ? error.message : "Failed to delete backup"
      );
    } finally {
      setIsDeleting(false);
    }
  }, [cloudSync.config, setLastSync]);

  const isConfigValid =
    localApiUrl.trim() &&
    localUsername.trim() &&
    localPassword.length > 0;

  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Info Section */}
      <div className="bg-paper-dark/50 rounded-lg p-4 border border-border-warm">
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-forest-green text-xl mt-0.5">
            info
          </span>
          <div className="text-sm text-light-gray-text">
            <p className="mb-2">
              Sync your library across devices using a Cloudflare Worker API.
              Your backup includes all books, reading progress, vocabulary, and
              settings.
            </p>
            <p className="text-muted-gray-text">
              Configure your Cloudflare Worker API endpoint and credentials below.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-light-gray-text">
          API Configuration
        </h3>

        <div className="space-y-3">
          <div>
            <label
              htmlFor="api-url"
              className="block text-sm text-muted-gray-text mb-1.5"
            >
              API URL
            </label>
            <input
              id="api-url"
              type="url"
              value={localApiUrl}
              onChange={(e) => setLocalApiUrl(e.target.value)}
              placeholder="https://your-worker.your-subdomain.workers.dev"
              className="w-full px-3 py-2 bg-paper-dark border border-border-warm rounded-lg text-light-gray-text placeholder-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green/40 focus:border-forest-green"
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm text-muted-gray-text mb-1.5"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
              placeholder="Your username"
              className="w-full px-3 py-2 bg-paper-dark border border-border-warm rounded-lg text-light-gray-text placeholder-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green/40 focus:border-forest-green"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm text-muted-gray-text mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={localPassword}
              onChange={(e) => setLocalPassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-3 py-2 bg-paper-dark border border-border-warm rounded-lg text-light-gray-text placeholder-muted-gray-text focus:outline-none focus:ring-2 focus:ring-forest-green/40 focus:border-forest-green"
            />
          </div>

          <Button
            variant="secondary"
            onClick={handleSaveConfig}
            disabled={!isConfigValid}
            icon="save"
          >
            Save Configuration
          </Button>
        </div>
      </div>

      {/* Sync Actions */}
      {isConfigValid && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-light-gray-text">
            Sync Actions
          </h3>

          <div className="space-y-3">
            <Button
              variant="primary"
              onClick={handleUpload}
              disabled={isUploading || isDownloading || isDeleting}
              icon={isUploading ? "progress_activity" : "cloud_upload"}
              className={isUploading ? "[&_span]:animate-spin" : ""}
            >
              {isUploading ? "Uploading..." : "Upload to Cloud"}
            </Button>

            <Button
              variant="secondary"
              onClick={handleDownload}
              disabled={isUploading || isDownloading || isDeleting}
              icon={isDownloading ? "progress_activity" : "cloud_download"}
              className={isDownloading ? "[&_span]:animate-spin" : ""}
            >
              {isDownloading ? "Downloading..." : "Download from Cloud"}
            </Button>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5">
                  warning
                </span>
                <p className="text-sm text-amber-700">
                  Downloading will replace your current library and settings.
                  Consider uploading a backup first.
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={handleDelete}
              disabled={isUploading || isDownloading || isDeleting}
              icon={isDeleting ? "progress_activity" : "delete"}
              className={isDeleting ? "[&_span]:animate-spin" : ""}
            >
              {isDeleting ? "Deleting..." : "Delete Cloud Backup"}
            </Button>
          </div>
        </div>
      )}

      {/* Last Sync Status */}
      {cloudSync.lastSyncAt !== null && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-light-gray-text">
            Last Sync Status
          </h3>
          <div
            className={`flex items-center gap-2 p-3 rounded-lg ${
              cloudSync.lastSyncStatus === "success"
                ? "bg-green-500/10 border border-green-500/30"
                : "bg-red-500/10 border border-red-500/30"
            }`}
          >
            <span
              className={`material-symbols-outlined text-lg ${
                cloudSync.lastSyncStatus === "success"
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {cloudSync.lastSyncStatus === "success"
                ? "check_circle"
                : "error"}
            </span>
            <div className="flex-1">
              <p
                className={`text-sm ${
                  cloudSync.lastSyncStatus === "success"
                    ? "text-green-300"
                    : "text-red-300"
                }`}
              >
                {cloudSync.lastSyncMessage}
              </p>
              <p className="text-xs text-muted-gray-text mt-1">
                {formatLastSync(cloudSync.lastSyncAt)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

