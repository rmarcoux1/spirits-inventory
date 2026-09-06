import { useCallback, useEffect, useState } from "react";
import { api, type Bottle, type NewBottle } from "../api";

export function useBottles() {
  const [bottles, setBottles] = useState<Bottle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setBottles(await api.listBottles());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  async function addBottle(input: NewBottle) {
    // If an identical bottle (same name/vintage/proof) already exists,
    // bump its quantity instead of creating a duplicate row.
    const existing = bottles.find(
      (b) =>
        b.name === input.name &&
        (input.type !== "wine" && input.type !== "champagne" ? true : b.vintage === input.vintage) &&
        (input.type !== "whiskey" ? true : b.proof === input.proof)
    );

    if (existing) {
      const updated = await api.updateBottle(existing.id, {
        quantity: existing.quantity + input.quantity,
        purchase_price: input.purchase_price ?? existing.purchase_price,
        barcode: input.barcode ?? existing.barcode,
        image_url: input.image_url ?? existing.image_url,
      });
      setBottles((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      return updated;
    }

    const created = await api.createBottle(input);
    setBottles((prev) => [created, ...prev]);
    return created;
  }

  async function updateQuantity(id: string, delta: number) {
    const bottle = bottles.find((b) => b.id === id);
    if (!bottle) return;
    const quantity = Math.max(0, bottle.quantity + delta);
    setBottles((prev) => prev.map((b) => (b.id === id ? { ...b, quantity } : b)));
    try {
      await api.updateBottle(id, { quantity });
    } catch (err) {
      setBottles((prev) => prev.map((b) => (b.id === id ? bottle : b)));
      console.error(err);
    }
  }

  // Full-record edit (as opposed to updateQuantity's quick +/- delta) —
  // replaces every editable field with what's in `patch`, for the Edit
  // bottle page.
  async function editBottle(id: string, patch: NewBottle) {
    const updated = await api.updateBottle(id, patch);
    setBottles((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  }

  async function removeBottle(id: string) {
    const prev = bottles;
    setBottles((p) => p.filter((b) => b.id !== id));
    try {
      await api.deleteBottle(id);
    } catch (err) {
      setBottles(prev);
      console.error(err);
    }
  }

  return { bottles, loading, error, reload, addBottle, updateQuantity, editBottle, removeBottle };
}
