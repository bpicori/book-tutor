import { memo } from "react";
import { useStore } from "../../store/useStore";
import { getTocDepthOptions, type TocDepth } from "../../utils/tocUtils";
import { useChapterScopeDepth } from "../../hooks/useChapterScopeDepth";
import type { TOCItem } from "../../types";

const DEPTH_NAMES = [
  "Top level",
  "Sections",
  "Sub-sections",
  "Level 4",
  "Level 5",
];

function depthName(depth: TocDepth): string {
  return DEPTH_NAMES[depth] ?? `Level ${depth + 1}`;
}

interface ChapterScopeSelectorProps {
  toc: TOCItem[];
}

/**
 * Lets the reader pick which table of contents depth counts as a chapter.
 *
 * Books differ: some have flat chapters, others nest sections two or three
 * levels deep. The choice is stored per book and is the single scope used by
 * both the chapter preview and Ask AI.
 */
export const ChapterScopeSelector = memo(function ChapterScopeSelector({
  toc,
}: ChapterScopeSelectorProps) {
  const currentBookId = useStore((state) => state.currentBookId);
  const setBookChapterScopeDepth = useStore(
    (state) => state.setBookChapterScopeDepth
  );
  const selectedDepth = useChapterScopeDepth();

  const options = getTocDepthOptions(toc);
  if (!currentBookId || options.length < 2) return null;

  return (
    <div className="field">
      <label htmlFor="chapter-scope-depth">A chapter is</label>
      <select
        id="chapter-scope-depth"
        className="input"
        value={selectedDepth === null ? "default" : String(selectedDepth)}
        onChange={(event) =>
          setBookChapterScopeDepth(
            currentBookId,
            event.target.value === "default" ? null : Number(event.target.value)
          )
        }
      >
        <option value="default">Automatic</option>
        {options.map((option) => (
          <option key={option.depth} value={option.depth}>
            {depthName(option.depth)} ({option.scopeCount}{" "}
            {option.scopeCount === 1 ? "chapter" : "chapters"})
          </option>
        ))}
      </select>
      <p className="note">
        {selectedDepth === null
          ? "Sub-sections preview with the section above them; Ask AI reads the entry you are in."
          : `Preview and Ask AI both cover the ${depthName(
              selectedDepth
            ).toLowerCase()} chapter you are in.`}
      </p>
    </div>
  );
});
