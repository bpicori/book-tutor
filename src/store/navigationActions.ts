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
  });
}

export function syncReaderRoute(bookId: string): void {
  leaveReaderContext({ bookId });
}
