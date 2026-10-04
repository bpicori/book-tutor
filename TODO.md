# Book Tutor — TODO

## Done

- [x] **Store conversations in Ask AI, should not be removed when refresh or switch page**
  Conversations are now written to local storage and no longer cleared on navigation.
  A quota-safe storage layer trims the oldest conversations instead of failing when
  local storage is full, and in-flight streaming replies are not persisted mid-token.
  ([useStore.ts](src/store/useStore.ts), [persistStorage.ts](src/store/persistStorage.ts))

- [x] **Handle chapter selections, define chapters as the main one**
  Each book picks which table of contents depth counts as a chapter
  (Contents tab → "A chapter is"). The choice is the single scope used by both the
  chapter preview and the text Ask AI reads, so choosing Top level makes a sub-section's
  preview cover the whole top-level chapter. Default behaviour is unchanged.
  ([ChapterScopeSelector.tsx](src/components/reader/ChapterScopeSelector.tsx), [tocUtils.ts](src/utils/tocUtils.ts))

- [x] **Fix button responsiveness (Library and Collapse)**
  The header is now a full-width top bar with explicit zones, consistent spacing from
  320 px up, and no layout shift when the Library label appears. The contents list
  gained collapsible levels and only the outermost level starts open.
  ([Header.tsx](src/components/reader/Header.tsx), [TocTree.tsx](src/components/reader/TocTree.tsx))

- [x] **Questions to Consider: clickable / ask AI**
  Each guiding question in the preview is a button that switches the panel to Ask with
  that question prefilled.
  ([PreviewTab.tsx](src/components/chat/PreviewTab.tsx), [useAskQuestion.ts](src/hooks/useAskQuestion.ts))

- [x] **Manual bookmarks**
  One bookmark per book, like a real bookmark: the footer button sets it on the current
  page, removes it when pressed on the page it marks, and a second button appears to
  jump back to it whenever you have read on. Bookmarks persist and are removed with
  their book. ([useBookmarks.ts](src/hooks/useBookmarks.ts), [Footer.tsx](src/components/reader/Footer.tsx))

- [x] **Sidebars on top of the book**
  The chapters panel and the AI panel overlay the book instead of resizing it, so
  opening either one no longer re-flows the text. They start below the top bar and are
  closed with their own button (or the scrim on mobile).
  ([Sidebar.tsx](src/components/reader/Sidebar.tsx), [AISidebar.tsx](src/components/chat/AISidebar.tsx))

- [x] **Review Preview Chapter and Ask AI**
  Chunking now only starts past ~200k characters instead of 40k, so a normal chapter is
  sent whole. Raw chapter text is kept for the preview and preferred by Ask AI
  (summaries are the fallback, not the replacement). Rolling summaries have a capped
  context, conversation history and book memory have budgets, preview JSON is recovered
  from fenced or chatty replies with one retry, and the preview temperature dropped from
  0.7 to 0.3. ([llmPreview.ts](src/services/llmPreview.ts), [prompts.ts](src/services/prompts.ts), [chapterChat.ts](src/utils/chapterChat.ts))

## Follow-ups

- [ ] Verify the header at 320 / 375 / 768 / 1280 px in a real browser, and confirm the
      reference screenshot (Pasted image 20261004214219.jpg) issue is the one fixed.
- [ ] Preview generation is still click-to-generate. A setting to auto-generate on
      chapter open was deliberately left out.
- [ ] A question clicked in the Preview tab is dropped if a reply is still streaming.
