import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { FoliateView } from "../../types";
import { useStore } from "../../store/useStore";
import { useCurrentBookId, useNavigation } from "../../hooks/useNavigation";
import { ROUTES } from "../../constants";
import { useBookLoader } from "../../hooks/useBookLoader";
import { useKeyboardNavigation } from "../../hooks/useKeyboardNavigation";
import { useReadAloud } from "../../hooks/useReadAloud";
import { getBookTitle } from "../../utils/metadata";
import { toPercent } from "../../utils/formatDates";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { Reader } from "../../components/reader/Reader";
import { ReaderBar } from "../../components/reader/ReaderBar";
import { MarginNote } from "../../components/reader/MarginNote";
import { ReaderPager } from "../../components/reader/ReaderPager";
import { PlayerBar } from "../../components/reader/PlayerBar";
import { ContentsDrawer } from "../../components/reader/ContentsDrawer";
import { GuidePanel } from "../../components/guide/GuidePanel";
import {
  findSampleChapterHref,
  hasDemoPreview,
  isSampleBook,
} from "../../demo";

export function ReaderPage() {
  const viewRef = useRef<FoliateView | null>(null);
  const currentBookId = useCurrentBookId();
  const { goToLibrary } = useNavigation();
  const navigate = useNavigate();
  const showToast = useToast();

  const book = useStore((state) => state.book);
  const coverUrl = useStore((state) => state.coverUrl);
  const library = useStore((state) => state.library);
  const progress = useStore((state) => state.progress);
  const settings = useStore((state) => state.settings);
  const currentTocHref = useStore((state) => state.currentTocHref);
  const isAiSidebarOpen = useStore((state) => state.isAiSidebarOpen);
  const isSidebarCollapsed = useStore((state) => state.isSidebarCollapsed);
  const setAiSidebarOpen = useStore((state) => state.setAiSidebarOpen);
  const setSidebarCollapsed = useStore((state) => state.setSidebarCollapsed);
  const setActiveAiTab = useStore((state) => state.setActiveAiTab);
  const speechConfigured = useStore((state) =>
    Boolean(state.settings.speechProvider?.apiKey.trim())
  );
  const updateBookProgress = useStore((state) => state.updateBookProgress);
  const updateBookLocation = useStore((state) => state.updateBookLocation);

  useEffect(() => {
    if (currentBookId) {
      useStore.setState({ currentBookId });
    }
  }, [currentBookId]);

  const { isLoading, error } = useBookLoader(viewRef, currentBookId);
  const player = useReadAloud({ viewRef, ready: !isLoading });
  useKeyboardNavigation(viewRef, player.isActive);

  const title = getBookTitle(book?.metadata, "Book");
  const percent = toPercent(progress.fraction);
  const chapterLabel = progress.tocLabel || "Reading";
  const fallbackCover =
    library.find((entry) => entry.id === currentBookId)?.coverDataUrl ?? null;
  const cover = coverUrl ?? fallbackCover;
  const listenHref = currentTocHref ?? book?.toc?.[0]?.href ?? null;

  const stopReadAloud = player.stop;
  const handleNavigate = useCallback(
    (href: string) => {
      stopReadAloud();
      void viewRef.current?.goTo(href);
    },
    [stopReadAloud]
  );
  const handlePrev = useCallback(() => {
    stopReadAloud();
    void viewRef.current?.prev();
  }, [stopReadAloud]);
  const handleNext = useCallback(() => {
    stopReadAloud();
    void viewRef.current?.next();
  }, [stopReadAloud]);

  useEffect(() => {
    if (currentBookId && progress.fraction > 0) {
      updateBookProgress(currentBookId, progress.fraction);
    }
  }, [currentBookId, progress.fraction, updateBookProgress]);

  useEffect(() => {
    if (currentBookId && progress.cfi) {
      updateBookLocation(currentBookId, progress.cfi);
    }
  }, [currentBookId, progress.cfi, updateBookLocation]);

  useEffect(() => {
    document.body.classList.toggle("guide-open", isAiSidebarOpen);
    return () => document.body.classList.remove("guide-open");
  }, [isAiSidebarOpen]);

  // The sample book opens at its first written chapter instead of the cover, so
  // a visitor sees a real chapter (and a working guide) straight away. Once the
  // reader is inside one of the written chapters, their position is kept.
  const sampleJumped = useRef(false);
  useEffect(() => {
    if (sampleJumped.current || !isSampleBook(currentBookId) || isLoading) {
      return;
    }
    if (hasDemoPreview(progress.tocLabel ?? "")) return;

    const href = findSampleChapterHref(book?.toc);
    if (!href) return;

    sampleJumped.current = true;
    void viewRef.current?.goTo(href);
  }, [book, currentBookId, isLoading, progress.tocLabel]);

  useEffect(() => {
    document.body.classList.toggle("toc-open", !isSidebarCollapsed);
    return () => document.body.classList.remove("toc-open");
  }, [isSidebarCollapsed]);

  const initialOverlayResolved = useRef(false);
  useEffect(() => {
    if (initialOverlayResolved.current) return;
    initialOverlayResolved.current = true;
    if (isAiSidebarOpen && !isSidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  }, [isAiSidebarOpen, isSidebarCollapsed, setSidebarCollapsed]);

  useEffect(
    () => () => {
      document.body.classList.remove("guide-open");
      document.body.classList.remove("toc-open");
    },
    []
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isAiSidebarOpen) {
        setAiSidebarOpen(false);
        return;
      }
      if (!isSidebarCollapsed) setSidebarCollapsed(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isAiSidebarOpen,
    isSidebarCollapsed,
    setAiSidebarOpen,
    setSidebarCollapsed,
  ]);

  const closeOverlays = () => {
    setAiSidebarOpen(false);
    setSidebarCollapsed(true);
  };

  const openGuide = (tab?: "preview" | "ask") => {
    setSidebarCollapsed(true);
    setAiSidebarOpen(true);
    if (tab) setActiveAiTab(tab);
  };

  const handleToggleGuide = () => {
    if (isAiSidebarOpen) {
      setAiSidebarOpen(false);
      return;
    }
    openGuide();
  };

  const handleToggleContents = () => {
    if (!isSidebarCollapsed) {
      setSidebarCollapsed(true);
      return;
    }
    setAiSidebarOpen(false);
    setSidebarCollapsed(false);
  };

  const handleListen = () => {
    if (player.isActive) {
      player.stop();
      return;
    }
    if (!speechConfigured) {
      showToast({
        message: "Add a speech provider in Voice settings to listen.",
      });
      return;
    }
    if (!listenHref) {
      showToast({
        message: "Choose a chapter in Contents to start listening.",
      });
      return;
    }
    player.startChapter(listenHref);
  };

  if (error) {
    return (
      <div className="reader-page">
        <div className="reader-error">
          <div className="reader-error-inner">
            <p className="eyebrow">This page is missing</p>
            <h2>We could not open this book.</h2>
            <p>{error}</p>
            <Button variant="secondary" onClick={goToLibrary}>
              Back to library
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reader-page">
      {settings.showProgress && (
        <div className="reader-progress" aria-hidden="true">
          <span style={{ width: `${percent}%` }} />
        </div>
      )}

      <ReaderBar
        title={title}
        coverUrl={cover}
        chapterLabel={chapterLabel}
        percent={percent}
        contentsOpen={!isSidebarCollapsed}
        guideOpen={isAiSidebarOpen}
        listening={player.isActive}
        canListen={Boolean(listenHref)}
        onToggleContents={handleToggleContents}
        onToggleGuide={handleToggleGuide}
        onListen={handleListen}
      />

      <div className="reader-stage">
        <div className="reader-inner">
          <div className="reading-body">
            <div className="reading-view">
              <Reader viewRef={viewRef} player={player} />
            </div>
          </div>
          <MarginNote percent={percent} onAsk={() => openGuide("ask")} />
        </div>
      </div>

      {!player.isActive && (
        <ReaderPager
          onPrev={handlePrev}
          onNext={handleNext}
          percent={percent}
        />
      )}

      <PlayerBar
        player={player}
        chapterLabel={chapterLabel}
        onOpenSettings={() => {
          player.stop();
          navigate(ROUTES.settings("voice"));
        }}
      />

      <ContentsDrawer
        viewRef={viewRef}
        onNavigate={handleNavigate}
        onReadFromHere={player.startChapter}
      />

      <GuidePanel />

      <div className="scrim" aria-hidden="true" onClick={closeOverlays} />

      {isLoading && (
        <div className="reader-loading">
          <div className="reader-loading-inner">
            <span className="spinner" aria-hidden="true" />
            <span role="status">Loading book…</span>
          </div>
        </div>
      )}
    </div>
  );
}
