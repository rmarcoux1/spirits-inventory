import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useGroceryItems } from "../hooks/useGroceryItems";
import { groceryApi, type GroceryCategory, type GroceryPurchase, GROCERY_CATEGORIES, categoryIcon, categoryLabel } from "../groceryApi";
import { StatCard } from "../components/StatCard";
import { GroceryItemRow } from "../components/GroceryItemRow";
import { QuickScanDecrement } from "../components/QuickScanDecrement";
import { CategoryBreakdownChart } from "../components/CategoryBreakdownChart";

export default function GroceryDashboard() {
  const { items, loading, error, adjustQuantity, logPurchase, toggleShoppingList, removeItem } = useGroceryItems();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<GroceryCategory | "all">("all");
  const [showScan, setShowScan] = useState(false);
  const [purchases, setPurchases] = useState<GroceryPurchase[]>([]);

  useEffect(() => {
    groceryApi.listAllPurchases().then(setPurchases).catch(() => setPurchases([]));
  }, []);

  const spentThisMonth = useMemo(() => {
    const now = new Date();
    return purchases
      .filter((p) => {
        const d = new Date(p.purchased_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, p) => sum + p.price, 0);
  }, [purchases]);

  const lowStockCount = items.filter((i) => i.quantity === 0).length;

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const cat of GROCERY_CATEGORIES) c[cat] = 0;
    for (const i of items) c[i.category] = (c[i.category] ?? 0) + 1;
    return c;
  }, [items]);

  const visible = useMemo(() => {
    return items
      .filter((i) => activeCategory === "all" || i.category === activeCategory)
      .filter((i) => {
        if (!search.trim()) return true;
        const haystack = `${i.name} ${i.brand ?? ""}`.toLowerCase();
        return haystack.includes(search.trim().toLowerCase());
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, activeCategory, search]);

  return (
    <div className="page">
      <div className="stat-grid">
        <StatCard label="Items tracked" value={items.length.toString()} />
        <StatCard label="Out of stock" value={lowStockCount.toString()} />
        <StatCard label="Spent this month" value={`$${spentThisMonth.toFixed(2)}`} />
      </div>

      <div className="chart-card">
        <p className="chart-card-title">By category</p>
        <CategoryBreakdownChart items={items} />
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          type="search"
          placeholder="Search by name, brand…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-secondary" onClick={() => setShowScan((v) => !v)}>
          Quick scan
        </button>
      </div>

      {showScan && <QuickScanDecrement items={items} onDecrement={(id) => adjustQuantity(id, -1)} itemLabel="item" />}

      <div className="type-tabs grocery-category-tabs">
        <button
          className={activeCategory === "all" ? "tab tab--active" : "tab"}
          onClick={() => setActiveCategory("all")}
        >
          All ({counts.all})
        </button>
        {GROCERY_CATEGORIES.map((c) => (
          <button
            key={c}
            className={activeCategory === c ? "tab tab--active" : "tab"}
            onClick={() => setActiveCategory(c)}
          >
            {categoryIcon(c)} {categoryLabel(c)} ({counts[c] ?? 0})
          </button>
        ))}
      </div>

      {loading && <p className="state-message">Loading groceries…</p>}
      {error && <p className="state-message state-message--error">{error}</p>}

      {!loading && !error && visible.length === 0 && (
        <div className="empty-state">
          <p>{items.length === 0 ? "No items yet." : "Nothing matches that search."}</p>
          {items.length === 0 && (
            <Link to="/groceries/add" className="btn-secondary">
              Add your first item
            </Link>
          )}
        </div>
      )}

      <div className="grocery-list">
        {visible.map((item) => (
          <GroceryItemRow
            key={item.id}
            item={item}
            onAdjustQuantity={adjustQuantity}
            onToggleShoppingList={toggleShoppingList}
            onLogPurchase={logPurchase}
            onRemove={removeItem}
          />
        ))}
      </div>
    </div>
  );
}
