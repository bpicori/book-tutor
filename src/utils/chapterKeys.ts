export function makeChapterKey(
  bookId: string | null,
  chapterHref: string
): string {
  return bookId ? `${bookId}:${chapterHref}` : chapterHref;
}
