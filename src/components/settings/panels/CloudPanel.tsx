import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "../../../store/useStore";
import {
  uploadBackup,
  downloadBackup,
  deleteBackup,
} from "../../../services/cloudSyncService";
import { BACKUP_VERSION } from "../../../services/backupService";
import { Button } from "../../ui/Button";
import { Field, TextInput } from "../../ui/Field";

export function CloudPanel() {
  const cloudSync = useStore((state) => state.cloudSync);
  const updateCloudSyncConfig = useStore(
    (state) => state.updateCloudSyncConfig
  );
  const setLastSync = useStore((state) => state.setLastSync);

  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [localApiUrl, setLocalApiUrl] = useState(cloudSync.config.apiUrl);
  const [localUsername, setLocalUsername] = useState(cloudSync.config.username);
  const [localPassword, setLocalPassword] = useState(cloudSync.config.password);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const isValid =
      localApiUrl.trim() && localUsername.trim() && localPassword.length > 0;
    if (!isValid) return;

    const timer = setTimeout(() => {
      updateCloudSyncConfig({
        apiUrl: localApiUrl.trim(),
        username: localUsername.trim(),
        password: localPassword,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [localApiUrl, localUsername, localPassword, updateCloudSyncConfig]);

  const handleUpload = useCallback(async () => {
    setIsUploading(true);
    try {
      const result = await uploadBackup(cloudSync.config);
      const timestamp = result.success ? Date.now() : null;
      let message = result.message;
      if (result.success && result.version !== undefined) {
        if (result.version !== BACKUP_VERSION) {
          message += ` (Cloud backup version ${result.version}, local version ${BACKUP_VERSION})`;
        }
      }
      setLastSync(timestamp, result.success ? "success" : "error", message);
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
    setIsDownloading(true);
    try {
      const result = await downloadBackup(cloudSync.config);
      const timestamp = result.success ? Date.now() : null;
      let message = result.message;
      if (result.success && result.version !== undefined) {
        if (result.version !== BACKUP_VERSION) {
          message += ` (Cloud backup version ${result.version}, local version ${BACKUP_VERSION})`;
        }
      }
      setLastSync(timestamp, result.success ? "success" : "error", message);
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
    setIsDeleting(true);
    try {
      const result = await deleteBackup(cloudSync.config);
      setLastSync(null, result.success ? "success" : "error", result.message);
      setConfirmDelete(false);
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

  const isConfigValid = Boolean(
    localApiUrl.trim() && localUsername.trim() && localPassword.length > 0
  );
  const busy = isUploading || isDownloading || isDeleting;

  const formatLastSync = (timestamp: number | null): string => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <>
      <div className="set-head">
        <h2>Cloud</h2>
        <p>
          Sync your library across devices through a Cloudflare Worker API. The
          backup includes books, progress, vocabulary, and settings.
        </p>
      </div>

      <div className="form-grid">
        <Field label="API URL" htmlFor="cloud-url" span2>
          <TextInput
            id="cloud-url"
            type="url"
            value={localApiUrl}
            placeholder="https://your-worker.your-subdomain.workers.dev"
            spellCheck={false}
            autoComplete="off"
            onChange={(event) => setLocalApiUrl(event.target.value)}
          />
        </Field>
        <Field label="Username" htmlFor="cloud-username">
          <TextInput
            id="cloud-username"
            value={localUsername}
            placeholder="Your username"
            autoComplete="username"
            onChange={(event) => setLocalUsername(event.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="cloud-password">
          <TextInput
            id="cloud-password"
            type="password"
            value={localPassword}
            placeholder="Your password"
            autoComplete="current-password"
            onChange={(event) => setLocalPassword(event.target.value)}
          />
        </Field>
      </div>

      {isConfigValid && (
        <div className="data-block">
          <div>
            <h3>Sync actions</h3>
            <p>
              Restoring from cloud replaces your current library and settings
              with the cloud backup. Export a local backup first if needed.
            </p>
          </div>
          <div className="row-actions" style={{ margin: 0 }}>
            <Button
              variant="secondary"
              onClick={handleUpload}
              loading={isUploading}
              disabled={busy}
            >
              Backup to cloud
            </Button>
            <Button
              variant="secondary"
              onClick={handleDownload}
              loading={isDownloading}
              disabled={busy}
            >
              Restore from cloud
            </Button>
            {!confirmDelete ? (
              <Button
                variant="quiet"
                className="danger-text"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
              >
                Delete cloud backup
              </Button>
            ) : (
              <>
                <Button
                  variant="quiet"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  loading={isDeleting}
                >
                  Confirm delete
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {cloudSync.lastSyncAt !== null && (
        <div className="data-block">
          <div>
            <h3>Last sync</h3>
            <p>{formatLastSync(cloudSync.lastSyncAt)}</p>
          </div>
          <p
            className="inline-status"
            role="status"
            data-state={cloudSync.lastSyncStatus === "success" ? "ok" : "error"}
          >
            {cloudSync.lastSyncMessage}
          </p>
        </div>
      )}

      <p className="note">
        Cloud sync is optional. Nothing is uploaded until you press one of the
        sync actions.
      </p>
    </>
  );
}
