import { useCallback, useEffect, useState } from "react";
import { shoppingListApi, type NewShoppingListItem, type ShoppingListItem } from "../groceryApi";

export function useShoppingList() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await shoppingListApi.listItems());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the shopping list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addItem(input: NewShoppingListItem) {
    const created = await shoppingListApi.createItem(input);
    setItems((prev) => [...prev, created]);
    return created;
  }

  // "Got it" — bought it, take it off the list. No connection to
  // inventory quantity; if you want it tracked on-hand too, that's a
  // separate manual step in Groceries.
  async function removeItem(id: string) {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    try {
      await shoppingListApi.deleteItem(id);
    } catch (err) {
      setItems(prev);
      console.error(err);
    }
  }

  async function adjustQuantity(id: string, delta: number) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const quantity = Math.max(1, item.quantity + delta);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    try {
      await shoppingListApi.updateItem(id, { quantity });
    } catch (err) {
      setItems((prev) => prev.map((i) => (i.id === id ? item : i)));
      console.error(err);
    }
  }

  // Bridges to inventory by name, not by any stored link — see
  // GroceryDashboard, which uses this to make the star behave like a
  // toggle without GroceryItem and ShoppingListItem knowing about each
  // other directly.
  function findByName(name: string) {
    const target = name.trim().toLowerCase();
    return items.find((i) => i.name.trim().toLowerCase() === target);
  }

  async function toggleByName(name: string) {
    const existing = findByName(name);
    if (existing) {
      await removeItem(existing.id);
    } else {
      await addItem({ name, quantity: 1, note: null });
    }
  }

  return { items, loading, error, reload, addItem, removeItem, adjustQuantity, findByName, toggleByName };
}
