import { memo, useState, useRef, useEffect, useCallback } from "react";
import {
  exportBackup,
  importBackup,
  getBackupSizeEstimate,
} from "../../../services/backupService";

interface BackupInfo {
  booksCount: number;
  estimatedSizeMB: number;
}

export const BackupTab = memo(function BackupTab() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load backup info on mount
  useEffect(() => {
    getBackupSizeEstimate().then(setBackupInfo).catch(console.error);
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      await exportBackup();
      setMessage({
        type: "success",
        text: "Backup exported successfully! Check your downloads folder.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to export backup",
      });
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      setMessage(null);

      try {
        const result = await importBackup(file);
        if (result.success) {
          setMessage({ type: "success", text: result.message });
          // Reload page to apply restored data
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setMessage({ type: "error", text: result.message });
        }
      } catch (error) {
        setMessage({
          type: "error",
          text:
            error instanceof Error ? error.message : "Failed to import backup",
        });
      } finally {
        setIsImporting(false);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    []
  );

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
              Export your library to transfer books and settings to another
              device. The backup includes:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-gray-text">
              <li>All your books (epub, pdf, etc.)</li>
              <li>Reading progress and positions</li>
              <li>Saved vocabulary words</li>
              <li>App settings (typography, LLM configuration)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Current Library Stats */}
      {backupInfo && (
        <div className="flex items-center gap-4 text-sm text-muted-gray-text">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">
              library_books
            </span>
            <span>
              {backupInfo.booksCount} book
              {backupInfo.booksCount !== 1 ? "s" : ""} in library
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">storage</span>
            <span>~{backupInfo.estimatedSizeMB} MB estimated backup size</span>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-light-gray-text">
          Export Backup
        </h3>
        <button
          onClick={handleExport}
          disabled={isExporting || isImporting}
          className="flex items-center gap-2 px-4 py-2.5 bg-forest-green hover:bg-forest-green/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <span className="material-symbols-outlined animate-spin text-lg">
                progress_activity
              </span>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">
                download
              </span>
              <span>Download Backup</span>
            </>
          )}
        </button>
      </div>

      {/* Import Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-light-gray-text">
          Import Backup
        </h3>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-3">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5">
              warning
            </span>
            <p className="text-sm text-amber-700">
              Importing a backup will replace your current library and settings.
              Consider exporting a backup first.
            </p>
          </div>
        </div>
        <button
          onClick={handleImportClick}
          disabled={isExporting || isImporting}
          className="flex items-center gap-2 px-4 py-2.5 bg-paper-dark hover:bg-paper-dark/80 text-light-gray-text border border-border-warm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImporting ? (
            <>
              <span className="material-symbols-outlined animate-spin text-lg">
                progress_activity
              </span>
              <span>Importing...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-lg">upload</span>
              <span>Select Backup File</span>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30"
              : "bg-red-500/10 border border-red-500/30"
          }`}
        >
          <span
            className={`material-symbols-outlined text-lg ${
              message.type === "success" ? "text-green-500" : "text-red-500"
            }`}
          >
            {message.type === "success" ? "check_circle" : "error"}
          </span>
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-300" : "text-red-300"
            }`}
          >
            {message.text}
          </p>
        </div>
      )}
    </div>
  );
});
