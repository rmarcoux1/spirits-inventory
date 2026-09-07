import { useMemo, useState } from "react";
import { useShoppingList } from "../hooks/useShoppingList";
import { useGroceryItems } from "../hooks/useGroceryItems";

export default function ShoppingListPage() {
  const { items, loading, error, addItem, removeItem, adjustQuantity, findByName } = useShoppingList();
  const { items: groceryItems } = useGroceryItems();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [staplesStatus, setStaplesStatus] = useState<string | null>(null);
  const [addingStaples, setAddingStaples] = useState(false);

  const staples = useMemo(() => groceryItems.filter((i) => i.is_staple), [groceryItems]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      await addItem({ name: name.trim(), quantity: 1, note: null });
      setName("");
    } finally {
      setAdding(false);
    }
  }

  async function handleAddAllStaples() {
    setAddingStaples(true);
    setStaplesStatus(null);
    try {
      const missing = staples.filter((s) => !findByName(s.name));
      for (const staple of missing) {
        await addItem({ name: staple.name, quantity: 1, note: null });
      }
      setStaplesStatus(
        missing.length === 0
          ? "All your staples are already on the list."
          : `Added ${missing.length} staple${missing.length === 1 ? "" : "s"} to the list.`
      );
    } finally {
      setAddingStaples(false);
    }
  }

  return (
    <div className="page">
      <p className="section-heading">Shopping list</p>

      {staples.length > 0 && (
        <div className="staples-panel">
          <div>
            <p className="staples-panel-title">🔁 Weekly staples</p>
            <p className="staples-panel-hint">
              {staples.length} item{staples.length === 1 ? "" : "s"} marked as staples in Groceries
            </p>
          </div>
          <button className="btn-primary" onClick={handleAddAllStaples} disabled={addingStaples}>
            {addingStaples ? "Adding…" : "Add all staples"}
          </button>
        </div>
      )}
      {staplesStatus && <p className="scan-status">{staplesStatus}</p>}

      <form onSubmit={handleAdd} className="shopping-quick-add">
        <input
          className="search-input"
          placeholder="Add an item…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <button type="submit" className="btn-primary" disabled={adding}>
          Add
        </button>
      </form>

      {loading && <p className="state-message">Loading…</p>}
      {error && <p className="state-message state-message--error">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="empty-state">
          <p>Nothing on your list right now.</p>
          <p className="empty-state-hint">
            Add something above, tap the ★ on any item in Groceries, or use "Add all staples" if you've got any
            marked.
          </p>
        </div>
      )}

      <ul className="shopping-list-items">
        {items.map((item) => (
          <li key={item.id} className="shopping-list-item">
            <button className="shopping-check" onClick={() => removeItem(item.id)} aria-label={`Got ${item.name}`}>
              ☐
            </button>
            <span className="shopping-list-item-name">{item.name}</span>
            <div className="qty-control">
              <button aria-label="Decrease quantity" onClick={() => adjustQuantity(item.id, -1)}>
                −
              </button>
              <span>{item.quantity}</span>
              <button aria-label="Increase quantity" onClick={() => adjustQuantity(item.id, 1)}>
                +
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
