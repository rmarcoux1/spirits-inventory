import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useBottles } from "../hooks/useBottles";
import { BOTTLE_TYPES, type BottleType } from "../api";
import { StatCard } from "../components/StatCard";
import { TypeBreakdownChart } from "../components/TypeBreakdownChart";
import { FilterBar } from "../components/FilterBar";
import { BottleCard } from "../components/BottleCard";
import { QuickScanDecrement } from "../components/QuickScanDecrement";

export default function Dashboard() {
  const { bottles, loading, error, updateQuantity, removeBottle } = useBottles();
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState<BottleType | "all">("all");
  const [sort, setSort] = useState<"name" | "price">("name");
  const [showScan, setShowScan] = useState(false);

  const totalBottles = bottles.reduce((sum, b) => sum + b.quantity, 0);
  const totalValue = bottles.reduce((sum, b) => sum + (b.purchase_price ?? 0) * b.quantity, 0);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: 0 };
    for (const t of BOTTLE_TYPES) c[t] = 0;
    for (const b of bottles) {
      c.all += b.quantity;
      c[b.type] = (c[b.type] ?? 0) + b.quantity;
    }
    return c;
  }, [bottles]);

  const visible = useMemo(() => {
    return bottles
      .filter((b) => activeType === "all" || b.type === activeType)
      .filter((b) => {
        if (!search.trim()) return true;
        const haystack = `${b.name} ${b.producer ?? ""} ${b.country ?? ""}`.toLowerCase();
        return haystack.includes(search.trim().toLowerCase());
      })
      .sort((a, b) => {
        if (sort === "price") return (b.purchase_price ?? 0) - (a.purchase_price ?? 0);
        return a.name.localeCompare(b.name);
      });
  }, [bottles, activeType, search, sort]);

  return (
    <div className="page">
      <div className="stat-grid">
        <StatCard label="Total bottles" value={totalBottles.toString()} />
        <StatCard label="Total value" value={`$${totalValue.toLocaleString()}`} />
      </div>

      <div className="chart-card">
        <p className="chart-card-title">Breakdown by type</p>
        <TypeBreakdownChart bottles={bottles} />
      </div>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        activeType={activeType}
        onTypeChange={setActiveType}
        counts={counts}
        sort={sort}
        onSortChange={setSort}
      />

      <div className="quick-scan-toggle-row">
        <button className="btn-secondary" onClick={() => setShowScan((v) => !v)}>
          Quick scan
        </button>
      </div>

      {showScan && <QuickScanDecrement items={bottles} onDecrement={(id) => updateQuantity(id, -1)} itemLabel="bottle" />}

      {loading && <p className="state-message">Loading inventory…</p>}
      {error && <p className="state-message state-message--error">{error}</p>}

      {!loading && !error && visible.length === 0 && (
        <div className="empty-state">
          <p>{bottles.length === 0 ? "No bottles yet." : "Nothing matches that search."}</p>
          {bottles.length === 0 && (
            <Link to="/add" className="btn-secondary">
              Add your first bottle
            </Link>
          )}
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <p className="section-heading">In the cellar</p>
      )}

      <div className="bottle-grid">
        {visible.map((bottle) => (
          <BottleCard key={bottle.id} bottle={bottle} onAdjustQuantity={updateQuantity} onRemove={removeBottle} />
        ))}
      </div>
    </div>
  );
}
