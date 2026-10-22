import { useStore } from "./useStore";
import { initialReaderState } from "./slices/readerSlice";
import { navigationAISidebarReset } from "./slices/aiSidebarSlice";

interface LeaveReaderContextOptions {
  bookId?: string | null;
  library?: ReturnType<typeof useStore.getState>["library"];
}

export function leaveReaderContext(
  options: LeaveReaderContextOptions = {}
): void {
  const { bookId = null, library } = options;
  useStore.setState({
    currentBookId: bookId,
    ...(library ? { library } : {}),
    ...initialReaderState,
    ...navigationAISidebarReset,
    // Enter the next book with the panels closed; the library's preview
    // action reopens the guide after navigation.
    isSidebarCollapsed: true,
    isAiSidebarOpen: false,
  });
}

export function syncReaderRoute(bookId: string): void {
  leaveReaderContext({ bookId });
}
