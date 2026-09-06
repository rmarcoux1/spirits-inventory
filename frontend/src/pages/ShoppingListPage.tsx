import { Link } from "react-router-dom";
import { useGroceryItems } from "../hooks/useGroceryItems";
import { GroceryItemRow } from "../components/GroceryItemRow";

export default function ShoppingListPage() {
  const { items, loading, error, adjustQuantity, logPurchase, toggleShoppingList, removeItem } = useGroceryItems();

  const listed = items
    .filter((i) => i.on_shopping_list)
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  return (
    <div className="page">
      <p className="section-heading">Shopping list</p>

      {loading && <p className="state-message">Loading…</p>}
      {error && <p className="state-message state-message--error">{error}</p>}

      {!loading && !error && listed.length === 0 && (
        <div className="empty-state">
          <p>Nothing on your list right now.</p>
          <p className="empty-state-hint">
            Tap the ★ next to any item in your groceries to add it here, or mark it while adding a new item.
          </p>
          <Link to="/groceries" className="btn-secondary">
            Go to groceries
          </Link>
        </div>
      )}

      <div className="grocery-list">
        {listed.map((item) => (
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
