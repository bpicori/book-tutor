import { Chip } from "../ui/Chip";
import { SearchField } from "../ui/SearchField";

export type LibraryFilter = "all" | "reading" | "finished";

interface LibraryToolbarProps {
  filter: LibraryFilter;
  onFilterChange: (filter: LibraryFilter) => void;
  query: string;
  onQueryChange: (query: string) => void;
  counts: Record<LibraryFilter, number>;
}

export function LibraryToolbar({
  filter,
  onFilterChange,
  query,
  onQueryChange,
  counts,
}: LibraryToolbarProps) {
  return (
    <div className="lib-tools">
      <div className="lib-tools-left">
        <h2>All books</h2>
        <div className="chips" role="group" aria-label="Filter library">
          <Chip
            active={filter === "all"}
            count={counts.all}
            onClick={() => onFilterChange("all")}
          >
            All
          </Chip>
          <Chip
            active={filter === "reading"}
            count={counts.reading}
            onClick={() => onFilterChange("reading")}
          >
            Reading
          </Chip>
          <Chip
            active={filter === "finished"}
            count={counts.finished}
            onClick={() => onFilterChange("finished")}
          >
            Finished
          </Chip>
        </div>
      </div>
      <SearchField
        value={query}
        onChange={onQueryChange}
        placeholder="Search title or author"
        label="Search library"
      />
    </div>
  );
}
