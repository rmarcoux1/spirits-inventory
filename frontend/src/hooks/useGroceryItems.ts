import { useCallback, useEffect, useState } from "react";
import { groceryApi, type GroceryItem, type NewGroceryItem, type NewGroceryPurchase } from "../groceryApi";

export function useGroceryItems() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await groceryApi.listItems());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load groceries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addItem(input: NewGroceryItem) {
    const created = await groceryApi.createItem(input);
    setItems((prev) => [created, ...prev]);
    return created;
  }

  async function editItem(id: string, patch: NewGroceryItem) {
    const updated = await groceryApi.updateItem(id, patch);
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  }

  // Consumption — "I used one of these," not a purchase. Doesn't touch
  // price history.
  async function adjustQuantity(id: string, delta: number) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const quantity = Math.max(0, item.quantity + delta);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    try {
      await groceryApi.updateItem(id, { quantity });
    } catch (err) {
      setItems((prev) => prev.map((i) => (i.id === id ? item : i)));
      console.error(err);
    }
  }

  // A purchase — restocks quantity AND logs a price-history entry.
  async function logPurchase(id: string, purchase: NewGroceryPurchase) {
    const { item } = await groceryApi.logPurchase(id, purchase);
    setItems((prev) => prev.map((i) => (i.id === id ? item : i)));
    return item;
  }

  async function toggleShoppingList(id: string, on: boolean) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, on_shopping_list: on } : i)));
    try {
      await groceryApi.updateItem(id, { on_shopping_list: on });
    } catch (err) {
      setItems((prev) => prev.map((i) => (i.id === id ? item : i)));
      console.error(err);
    }
  }

  async function removeItem(id: string) {
    const prev = items;
    setItems((p) => p.filter((i) => i.id !== id));
    try {
      await groceryApi.deleteItem(id);
    } catch (err) {
      setItems(prev);
      console.error(err);
    }
  }

  return { items, loading, error, reload, addItem, editItem, adjustQuantity, logPurchase, toggleShoppingList, removeItem };
}
