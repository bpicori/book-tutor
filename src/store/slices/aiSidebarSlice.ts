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
  pendingQuote: string | null;

  // Actions
  setActiveAiTab: (tab: AiSidebarTab) => void;
  setPendingQuote: (quote: string | null) => void;
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
}

export const initialAISidebarState = {
  activeAiTab: "preview" as AiSidebarTab,
  chapterChats: {} as ChapterChats,
  chapterPreviews: {} as ChapterPreviews,
  previewLoading: false,
  pendingQuote: null as string | null,
};

/** Sidebar fields reset on navigation; preserves chapter chats and previews. */
export const navigationAISidebarReset = {
  activeAiTab: initialAISidebarState.activeAiTab,
  previewLoading: initialAISidebarState.previewLoading,
};

/** Deletes a conversation key instead of storing an empty entry. */
function withoutChapter(
  chapterChats: ChapterChats,
  chapterHref: string
): ChapterChats {
  const { [chapterHref]: _removed, ...rest } = chapterChats;
  return rest;
}

export const createAISidebarSlice: StateCreator<AISidebarSlice> = (set) => ({
  // Initial state
  ...initialAISidebarState,

  // Actions
  setActiveAiTab: (tab) => set({ activeAiTab: tab }),

  setPendingQuote: (quote) => set({ pendingQuote: quote }),

  addChatMessage: (chapterHref, message) =>
    set((state) => {
      const existing = state.chapterChats[chapterHref];
      return {
        chapterChats: {
          ...state.chapterChats,
          [chapterHref]: {
            messages: [...(existing?.messages ?? []), message],
            updatedAt: Date.now(),
          },
        },
      };
    }),

  updateLastChatMessage: (chapterHref, content, isStreaming) =>
    set((state) => {
      const existing = state.chapterChats[chapterHref];
      if (!existing || existing.messages.length === 0) return state;

      const lastMessage = existing.messages[existing.messages.length - 1];
      // Only a reply that is being streamed may be rewritten. Without this
      // guard a stray update would overwrite the reader's own question.
      if (lastMessage.role !== "assistant" || !lastMessage.isStreaming) {
        return state;
      }

      const messages = [...existing.messages];
      messages[messages.length - 1] = {
        ...lastMessage,
        content,
        isStreaming: isStreaming ?? false,
      };

      return {
        chapterChats: {
          ...state.chapterChats,
          [chapterHref]: { messages, updatedAt: Date.now() },
        },
      };
    }),

  clearChapterChat: (chapterHref) =>
    set((state) => ({
      chapterChats: withoutChapter(state.chapterChats, chapterHref),
    })),

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
});
