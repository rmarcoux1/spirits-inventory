import { type BottleType, BOTTLE_TYPES, typeIcon, typeLabel } from "../api";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  activeType: BottleType | "all";
  onTypeChange: (v: BottleType | "all") => void;
  counts: Record<string, number>;
  sort: "name" | "price";
  onSortChange: (v: "name" | "price") => void;
}

export function FilterBar({ search, onSearchChange, activeType, onTypeChange, counts, sort, onSortChange }: Props) {
  return (
    <div className="filter-bar">
      <input
        className="search-input"
        type="search"
        placeholder="Search by name, producer, country…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select className="sort-select" value={sort} onChange={(e) => onSortChange(e.target.value as "name" | "price")}>
        <option value="name">Sort by name</option>
        <option value="price">Sort by price</option>
      </select>
      <div className="type-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeType === "all"}
          className={activeType === "all" ? "tab tab--active" : "tab"}
          onClick={() => onTypeChange("all")}
        >
          All ({counts.all ?? 0})
        </button>
        {BOTTLE_TYPES.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={activeType === t}
            className={activeType === t ? "tab tab--active" : "tab"}
            onClick={() => onTypeChange(t)}
          >
            {typeIcon(t)} {typeLabel(t)} ({counts[t] ?? 0})
          </button>
        ))}
      </div>
    </div>
  );
}
