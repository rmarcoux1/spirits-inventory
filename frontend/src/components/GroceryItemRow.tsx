import { Link } from "react-router-dom";
import { type GroceryItem, categoryIcon, categoryLabel } from "../groceryApi";

interface Props {
  item: GroceryItem;
  onAdjustQuantity: (id: string, delta: number) => void;
  onToggleShoppingList: () => void;
  isOnShoppingList: boolean;
  onRemove: (id: string) => void;
}

export function GroceryItemRow({ item, onAdjustQuantity, onToggleShoppingList, isOnShoppingList, onRemove }: Props) {
  return (
    <div className={`grocery-row${item.quantity === 0 ? " grocery-row--empty" : ""}`}>
      <div className="grocery-row-main">
        <button
          className={`shopping-star${isOnShoppingList ? " shopping-star--on" : ""}`}
          onClick={onToggleShoppingList}
          aria-label={isOnShoppingList ? "Remove from shopping list" : "Add to shopping list"}
          title={isOnShoppingList ? "On shopping list" : "Add to shopping list"}
        >
          ★
        </button>

        <div className="grocery-row-media" aria-hidden="true">
          {item.image_url ? <img src={item.image_url} alt="" /> : categoryIcon(item.category)}
        </div>

        <div className="grocery-row-info">
          <p className="grocery-row-category">
            {categoryIcon(item.category)} {categoryLabel(item.category)}
            {item.is_staple && <span className="staple-badge">🔁 Staple</span>}
          </p>
          <h4>{item.name}</h4>
          <p className="grocery-row-meta">{[item.brand, item.unit].filter(Boolean).join(" · ")}</p>
        </div>

        <div className="qty-control">
          <button aria-label="Decrease quantity" onClick={() => onAdjustQuantity(item.id, -1)}>
            −
          </button>
          <span>
            {item.quantity}
            {item.unit ? ` ${item.unit}` : ""}
          </span>
          <button aria-label="Increase quantity" onClick={() => onAdjustQuantity(item.id, 1)}>
            +
          </button>
        </div>

        <div className="grocery-row-actions">
          <Link to={`/groceries/edit/${item.id}`} className="btn-ghost">
            Edit
          </Link>
          <button className="btn-ghost btn-remove" onClick={() => onRemove(item.id)}>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
