import { useState } from "react";
import { Link } from "react-router-dom";
import { type GroceryItem, categoryIcon, categoryLabel } from "../groceryApi";

interface Props {
  item: GroceryItem;
  onAdjustQuantity: (id: string, delta: number) => void;
  onToggleShoppingList: (id: string, on: boolean) => void;
  onLogPurchase: (id: string, purchase: { price: number; quantity: number; store: string | null; purchased_at: string }) => Promise<unknown>;
  onRemove: (id: string) => void;
}

export function GroceryItemRow({ item, onAdjustQuantity, onToggleShoppingList, onLogPurchase, onRemove }: Props) {
  const [logging, setLogging] = useState(false);
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [store, setStore] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitPurchase(e: React.FormEvent) {
    e.preventDefault();
    if (!price) return;
    setSaving(true);
    try {
      await onLogPurchase(item.id, {
        price: Number(price),
        quantity: Number(qty) || 1,
        store: store.trim() || null,
        purchased_at: new Date().toISOString(),
      });
      setPrice("");
      setQty("1");
      setStore("");
      setLogging(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`grocery-row${item.quantity === 0 ? " grocery-row--empty" : ""}`}>
      <div className="grocery-row-main">
        <button
          className={`shopping-star${item.on_shopping_list ? " shopping-star--on" : ""}`}
          onClick={() => onToggleShoppingList(item.id, !item.on_shopping_list)}
          aria-label={item.on_shopping_list ? "Remove from shopping list" : "Add to shopping list"}
          title={item.on_shopping_list ? "On shopping list" : "Add to shopping list"}
        >
          ★
        </button>

        <div className="grocery-row-media" aria-hidden="true">
          {item.image_url ? <img src={item.image_url} alt="" /> : categoryIcon(item.category)}
        </div>

        <div className="grocery-row-info">
          <p className="grocery-row-category">{categoryIcon(item.category)} {categoryLabel(item.category)}</p>
          <h4>{item.name}</h4>
          <p className="grocery-row-meta">
            {[item.brand, item.unit].filter(Boolean).join(" · ")}
            {item.last_price != null && ` · $${Number(item.last_price).toFixed(2)}`}
          </p>
        </div>

        <div className="qty-control">
          <button aria-label="Decrease quantity" onClick={() => onAdjustQuantity(item.id, -1)}>
            −
          </button>
          <span>
            {item.quantity}
          </span>
          <button aria-label="Increase quantity" onClick={() => onAdjustQuantity(item.id, 1)}>
            +
          </button>
        </div>

        <div className="grocery-row-actions">
          <button className="btn-ghost" onClick={() => setLogging((v) => !v)}>
            Log purchase
          </button>
          <Link to={`/groceries/edit/${item.id}`} className="btn-ghost">
            Edit
          </Link>
          <button className="btn-ghost btn-remove" onClick={() => onRemove(item.id)}>
            Remove
          </button>
        </div>
      </div>

      {logging && (
        <form className="log-purchase-form" onSubmit={submitPurchase}>
          <label className="field">
            <span>Price paid</span>
            <input
              type="number"
              step="0.01"
              required
              autoFocus
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Quantity bought</span>
            <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
          <label className="field">
            <span>Store (optional)</span>
            <input value={store} onChange={(e) => setStore(e.target.value)} />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Log it"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
