import type { StateCreator } from "zustand";
import type {
  ChatMessage,
  AiSidebarTab,
  ChapterPreview,
  ChapterChats,
  ChapterPreviews,
} from "../../types";

export interface AISidebarSlice {
  // State
  activeAiTab: AiSidebarTab;
  chapterChats: ChapterChats;
  chapterPreviews: ChapterPreviews;
  previewLoading: boolean;

  // Actions
  setActiveAiTab: (tab: AiSidebarTab) => void;
  addChatMessage: (chapterHref: string, message: ChatMessage) => void;
  updateLastChatMessage: (
    chapterHref: string,
    content: string,
    isStreaming?: boolean
  ) => void;
  clearChapterChat: (chapterHref: string) => void;
  setChapterPreview: (chapterHref: string, preview: ChapterPreview) => void;
  setPreviewLoading: (loading: boolean) => void;
  clearChapterPreview: (chapterHref: string) => void;
  clearBookPreviews: (bookId: string) => void;
  resetAISidebarState: () => void;
}

export const initialAISidebarState = {
  activeAiTab: "preview" as AiSidebarTab,
  chapterChats: {} as ChapterChats,
  chapterPreviews: {} as ChapterPreviews,
  previewLoading: false,
};

export const createAISidebarSlice: StateCreator<AISidebarSlice> = (set) => ({
  // Initial state
  ...initialAISidebarState,

  // Actions
  setActiveAiTab: (tab) => set({ activeAiTab: tab }),

  addChatMessage: (chapterHref, message) =>
    set((state) => {
      const currentMessages = state.chapterChats[chapterHref] || [];
      return {
        chapterChats: {
          ...state.chapterChats,
          [chapterHref]: [...currentMessages, message],
        },
      };
    }),

  updateLastChatMessage: (chapterHref, content, isStreaming) =>
    set((state) => {
      const messages = [...(state.chapterChats[chapterHref] || [])];
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        messages[messages.length - 1] = {
          ...lastMessage,
          content,
          isStreaming: isStreaming ?? false,
        };
      }
      return {
        chapterChats: {
          ...state.chapterChats,
          [chapterHref]: messages,
        },
      };
    }),

  clearChapterChat: (chapterHref) =>
    set((state) => {
      const { [chapterHref]: _, ...rest } = state.chapterChats;
      return { chapterChats: rest };
    }),

  setChapterPreview: (chapterHref, preview) =>
    set((state) => ({
      chapterPreviews: {
        ...state.chapterPreviews,
        [chapterHref]: preview,
      },
    })),

  setPreviewLoading: (loading) => set({ previewLoading: loading }),

  clearChapterPreview: (chapterHref) =>
    set((state) => {
      const { [chapterHref]: _, ...rest } = state.chapterPreviews;
      return { chapterPreviews: rest };
    }),

  clearBookPreviews: (bookId) =>
    set((state) => {
      // Filter out all previews for the specified book (keys start with "bookId:")
      const filteredPreviews = Object.fromEntries(
        Object.entries(state.chapterPreviews).filter(
          ([key]) => !key.startsWith(`${bookId}:`)
        )
      );
      return { chapterPreviews: filteredPreviews };
    }),

  resetAISidebarState: () => set(initialAISidebarState),
});
