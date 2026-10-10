import { useRef, useCallback, useEffect } from "react";
import type { FoliateView } from "../../types";
import { useStore } from "../../store/useStore";
import { useCurrentBookId } from "../../hooks/useNavigation";

import { useBookLoader } from "../../hooks/useBookLoader";
import { useKeyboardNavigation } from "../../hooks/useKeyboardNavigation";
import { useReadAloud } from "../../hooks/useReadAloud";
import { LoadingSpinner } from "../../components/common";
import { Sidebar, Header, Reader, Footer } from "../../components/reader";
import { AISidebar } from "../../components/chat";

export function ReaderPage() {
  const viewRef = useRef<FoliateView | null>(null);
  const currentBookId = useCurrentBookId();
  const { updateBookProgress, updateBookLocation, progress } = useStore();

  // Update store's currentBookId when URL changes
  useEffect(() => {
    if (currentBookId) {
      useStore.setState({ currentBookId });
    }
  }, [currentBookId]);
  const { isLoading, error } = useBookLoader(viewRef);

  const player = useReadAloud({ viewRef, ready: !isLoading });

  useKeyboardNavigation(viewRef, player.isActive);

  const stopReadAloud = player.stop;

  const handleNavigate = useCallback(
    (href: string) => {
      // Any manual jump stops the player first; it owns navigation while on.
      stopReadAloud();
      return viewRef.current?.goTo(href);
    },
    [stopReadAloud]
  );
  const handlePrev = useCallback(() => {
    stopReadAloud();
    return viewRef.current?.prev();
  }, [stopReadAloud]);
  const handleNext = useCallback(() => {
    stopReadAloud();
    return viewRef.current?.next();
  }, [stopReadAloud]);

  // Update progress in library
  useEffect(() => {
    if (currentBookId && progress.fraction > 0) {
      updateBookProgress(currentBookId, progress.fraction);
    }
  }, [currentBookId, progress.fraction, updateBookProgress]);

  // Save reading location for restoring on refresh
  useEffect(() => {
    if (currentBookId && progress.cfi) {
      updateBookLocation(currentBookId, progress.cfi);
    }
  }, [currentBookId, progress.cfi, updateBookLocation]);

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-warm-off-white">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-light-gray-text mb-4">
            error
          </span>
          <p className="text-muted-gray-text">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {isLoading && <LoadingSpinner message="Loading book..." fullScreen />}
      <Sidebar
        onNavigate={handleNavigate}
        onReadFromHere={player.startChapter}
        viewRef={viewRef}
      />
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          onPrev={handlePrev}
          onNext={handleNext}
          isReadAloudActive={player.isActive}
        />
        <Reader viewRef={viewRef} player={player} />
        <Footer onNavigate={handleNavigate} player={player} />
      </main>
      <AISidebar />
    </div>
  );
}
