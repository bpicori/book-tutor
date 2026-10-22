import { useCallback, useEffect, useRef, useState } from "react";
import {
  exportBackup,
  importBackup,
  getBackupSizeEstimate,
  resetApp,
} from "../../../services/backupService";
import { useStore } from "../../../store/useStore";
import { Button } from "../../ui/Button";
import { Dialog } from "../../ui/Dialog";
import { useToast } from "../../ui/Toast";

interface BackupInfo {
  booksCount: number;
  estimatedSizeMB: number;
}

type Status = { state: "ok" | "error"; text: string } | null;

export function DataPanel() {
  const library = useStore((state) => state.library);
  const words = useStore((state) => state.words);
  const showToast = useToast();

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getBackupSizeEstimate()
      .then(setBackupInfo)
      .catch((error) => console.error("Failed to estimate backup:", error));
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setStatus(null);
    try {
      await exportBackup();
      showToast({ message: "Backup downloaded." });
    } catch (error) {
      setStatus({
        state: "error",
        text:
          error instanceof Error ? error.message : "Failed to export backup.",
      });
    } finally {
      setIsExporting(false);
    }
  }, [showToast]);

  const handleImport = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setIsImporting(true);
      setStatus(null);
      try {
        const result = await importBackup(file);
        if (result.success) {
          setStatus({ state: "ok", text: result.message });
          showToast({ message: "Backup restored. Reloading…" });
          setTimeout(() => window.location.reload(), 1200);
        } else {
          setStatus({ state: "error", text: result.message });
        }
      } catch (error) {
        setStatus({
          state: "error",
          text:
            error instanceof Error ? error.message : "Failed to import backup.",
        });
      } finally {
        setIsImporting(false);
      }
    },
    [showToast]
  );

  const handleReset = useCallback(async () => {
    setIsResetting(true);
    setStatus(null);
    try {
      await resetApp();
    } catch (error) {
      setStatus({
        state: "error",
        text: error instanceof Error ? error.message : "Failed to reset app.",
      });
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  }, []);

  return (
    <>
      <div className="set-head">
        <h2>Data</h2>
        <p>
          Books, reading position, words, and settings live in this browser.
          Take a copy whenever you like.
        </p>
      </div>

      <div className="data-block">
        <div>
          <h3>Backup</h3>
          <p>
            Download a JSON file with your settings, your shelf, and every saved
            word. Import it on another browser to restore everything.
          </p>
        </div>
        <div className="row-actions" style={{ margin: 0 }}>
          <Button
            variant="secondary"
            onClick={handleExport}
            loading={isExporting}
            disabled={isImporting}
          >
            Export backup
          </Button>
          <Button
            variant="quiet"
            onClick={() => fileInputRef.current?.click()}
            loading={isImporting}
            disabled={isExporting}
          >
            Import backup
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(event) => {
              void handleImport(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="data-block">
        <div>
          <h3>Local storage</h3>
          <p>
            No account, no server copy. Clearing browser data removes the
            library.
          </p>
        </div>
        <p className="data-stat">
          <b>{library.length}</b> book{library.length === 1 ? "" : "s"} ·{" "}
          <b>{words.length}</b> word{words.length === 1 ? "" : "s"}
          {backupInfo && ` · ~${backupInfo.estimatedSizeMB} MB backup`}
        </p>
      </div>

      <div className="data-block">
        <div>
          <h3>Reset app</h3>
          <p>
            Permanently delete your library, highlights, vocabulary, chat
            history, and settings from this device. Export a backup first.
          </p>
        </div>
        <div className="row-actions" style={{ margin: 0 }}>
          <Button
            variant="secondary"
            onClick={() => setShowResetConfirm(true)}
            disabled={isExporting || isImporting || isResetting}
          >
            Reset app
          </Button>
        </div>
      </div>

      {status && (
        <p className="inline-status" role="status" data-state={status.state}>
          {status.text}
        </p>
      )}

      <p className="note">
        The backup file is portable between browsers. Cloud sync is optional and
        lives under Cloud.
      </p>

      <Dialog
        open={showResetConfirm}
        onClose={() => !isResetting && setShowResetConfirm(false)}
        eyebrow="Reset"
        title="Reset Book Tutor?"
        footer={
          <>
            <Button
              variant="quiet"
              onClick={() => setShowResetConfirm(false)}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReset}
              loading={isResetting}
            >
              Reset everything
            </Button>
          </>
        }
      >
        <p>
          This erases all books, reading progress, highlights, vocabulary,
          chapter previews, and settings stored on this device. This cannot be
          undone.
        </p>
      </Dialog>
    </>
  );
}
