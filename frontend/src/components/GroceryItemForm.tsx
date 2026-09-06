import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type GroceryCategory,
  type GroceryItem,
  type NewGroceryItem,
  GROCERY_CATEGORIES,
  categoryIcon,
  categoryLabel,
} from "../groceryApi";
import { lookupBarcode } from "../services/barcodeApi";

interface Props {
  mode: "add" | "edit";
  initial?: GroceryItem;
  onSubmit: (payload: NewGroceryItem) => Promise<unknown>;
}

function formFromItem(i?: GroceryItem) {
  return {
    name: i?.name ?? "",
    brand: i?.brand ?? "",
    category: (i?.category ?? "pantry") as GroceryCategory,
    unit: i?.unit ?? "",
    quantity: i?.quantity ?? 1,
    barcode: i?.barcode ?? "",
    image_url: i?.image_url ?? "",
    notes: i?.notes ?? "",
    on_shopping_list: i?.on_shopping_list ?? false,
  };
}

export function GroceryItemForm({ mode, initial, onSubmit }: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState(() => formFromItem(initial));
  const [manualBarcode, setManualBarcode] = useState("");
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ReturnType<typeof formFromItem>>(
    key: K,
    value: ReturnType<typeof formFromItem>[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleBarcode(barcode: string) {
    setScanStatus("Looking up item…");
    update("barcode", barcode);

    const result = await lookupBarcode(barcode);
    if (result.found) {
      setForm((f) => ({
        ...f,
        name: result.name ?? f.name,
        brand: result.producer ?? f.brand,
        image_url: result.image_url ?? f.image_url,
        category: (result.grocery_category as GroceryCategory) ?? f.category,
        notes: !f.notes && result.notes ? result.notes : f.notes,
      }));
      setScanStatus("Filled in from barcode — check the details below");
    } else if (result.error) {
      setScanStatus(`Lookup failed (${result.error}) — try again, or enter details manually.`);
    } else {
      setScanStatus("No match found for that barcode. Enter the details manually.");
    }
  }

  function handleManualLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    handleBarcode(manualBarcode.trim());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);

    const payload: NewGroceryItem = {
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      category: form.category,
      unit: form.unit.trim() || null,
      quantity: form.quantity,
      barcode: form.barcode || null,
      image_url: form.image_url || null,
      notes: form.notes.trim() || null,
      on_shopping_list: form.on_shopping_list,
    };

    try {
      await onSubmit(payload);
      navigate("/groceries");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-card">
      <div className="form-card-header">
        <h2>{mode === "edit" ? "Edit item" : "Add grocery item"}</h2>
      </div>

      <form onSubmit={handleManualLookup} className="manual-barcode-row">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Scan or type a barcode number…"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
        />
        <button type="submit" className="btn-secondary">
          Look up
        </button>
      </form>

      {scanStatus && <p className="scan-status">{scanStatus}</p>}

      <form onSubmit={handleSubmit} className="bottle-form">
        <label className="field full">
          <span>Name</span>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </label>

        <label className="field">
          <span>Brand</span>
          <input value={form.brand} onChange={(e) => update("brand", e.target.value)} />
        </label>

        <label className="field">
          <span>Category</span>
          <select value={form.category} onChange={(e) => update("category", e.target.value as GroceryCategory)}>
            {GROCERY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryIcon(c)} {categoryLabel(c)}
              </option>
            ))}
          </select>
        </label>

        <div className="field-row">
          <label className="field">
            <span>Quantity on hand</span>
            <input
              type="number"
              min={0}
              required
              value={form.quantity}
              onChange={(e) => update("quantity", Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Unit</span>
            <input
              placeholder="e.g. gal, dozen, lb, each"
              value={form.unit}
              onChange={(e) => update("unit", e.target.value)}
            />
          </label>
        </div>

        <label className="field full checkbox-field">
          <input
            type="checkbox"
            checked={form.on_shopping_list}
            onChange={(e) => update("on_shopping_list", e.target.checked)}
          />
          <span>Add to shopping list</span>
        </label>

        <label className="field full">
          <span>Notes</span>
          <textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </label>

        {form.image_url && (
          <div className="field full image-preview">
            <img src={form.image_url} alt={form.name || "Item preview"} />
          </div>
        )}

        {form.barcode && <p className="barcode-tag">Barcode: {form.barcode}</p>}
        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Add item"}
          </button>
        </div>
      </form>
    </div>
  );
}
