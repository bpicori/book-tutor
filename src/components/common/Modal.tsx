import { memo, useEffect } from "react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal = memo(function Modal({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full md:w-full md:max-w-2xl md:h-[600px] bg-sepia-panel md:rounded-lg shadow-xl border-0 md:border border-border-warm overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border-warm flex-shrink-0">
            <h2 className="text-lg md:text-xl font-bold text-muted-gray-text">{title}</h2>
            <Button
              variant="icon"
              onClick={onClose}
              icon="close"
              className="w-10 h-10 md:w-8 md:h-8"
              aria-label="Close"
            />
          </div>
        )}
        <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
});
