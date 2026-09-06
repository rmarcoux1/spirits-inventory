import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type Bottle,
  type BottleType,
  type NewBottle,
  STYLE_OPTIONS,
  VINTAGE_TYPES,
  SPIRIT_TYPES,
  typeIcon,
  typeLabel,
  BOTTLE_TYPES,
} from "../api";
import { lookupBarcode } from "../services/barcodeApi";

interface Props {
  mode: "add" | "edit";
  initial?: Bottle;
  onSubmit: (payload: NewBottle) => Promise<unknown>;
}

function formFromBottle(b?: Bottle) {
  return {
    name: b?.name ?? "",
    producer: b?.producer ?? "",
    country: b?.country ?? "",
    vintage: b?.vintage != null ? String(b.vintage) : "",
    proof: b?.proof != null ? String(b.proof) : "",
    volume_ml: b?.volume_ml != null ? String(b.volume_ml) : "750",
    spirit_type: b?.spirit_type ?? "",
    quantity: b?.quantity ?? 1,
    purchase_price: b?.purchase_price != null ? String(b.purchase_price) : "",
    barcode: b?.barcode ?? "",
    image_url: b?.image_url ?? "",
    notes: b?.notes ?? "",
  };
}

export function BottleForm({ mode, initial, onSubmit }: Props) {
  const navigate = useNavigate();
  const [type, setType] = useState<BottleType>(initial?.type ?? "wine");
  const [form, setForm] = useState(() => formFromBottle(initial));
  const [manualBarcode, setManualBarcode] = useState("");
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof ReturnType<typeof formFromBottle>>(
    key: K,
    value: ReturnType<typeof formFromBottle>[K]
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Fed by the manual/handheld-scanner barcode field below — a handheld
  // scanner just types the digits into whatever's focused and (usually)
  // sends Enter, which submits this little form the same as typing it
  // yourself would.
  async function handleBarcode(barcode: string) {
    setScanStatus("Looking up bottle…");
    update("barcode", barcode);

    const result = await lookupBarcode(barcode);
    if (result.found) {
      if (result.type) setType(result.type);
      setForm((f) => ({
        ...f,
        name: result.name ?? f.name,
        producer: result.producer ?? f.producer,
        spirit_type: result.spirit_type ?? f.spirit_type,
        volume_ml: result.volume_ml != null ? String(result.volume_ml) : f.volume_ml,
        proof: result.proof != null ? String(result.proof) : f.proof,
        image_url: result.image_url ?? f.image_url,
        // Only autofill notes into an empty field — don't clobber
        // something you already typed if you look up a second barcode
        // after starting to write your own notes.
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

    const payload: NewBottle = {
      type,
      name: form.name.trim(),
      producer: form.producer.trim() || null,
      country: form.country.trim() || null,
      vintage: VINTAGE_TYPES.includes(type) ? (form.vintage ? Number(form.vintage) : null) : null,
      proof: SPIRIT_TYPES.includes(type) ? (form.proof ? Number(form.proof) : null) : null,
      volume_ml: form.volume_ml ? Number(form.volume_ml) : null,
      spirit_type: form.spirit_type.trim() || null,
      quantity: form.quantity,
      purchase_price: form.purchase_price ? Number(form.purchase_price) : null,
      purchase_date: initial?.purchase_date ?? null,
      barcode: form.barcode || null,
      image_url: form.image_url || null,
      notes: form.notes.trim() || null,
    };

    try {
      await onSubmit(payload);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save bottle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="form-card">
      <div className="form-card-header">
        <h2>{mode === "edit" ? "Edit bottle" : "Add bottle"}</h2>
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
        <div className="field full">
          <span>Type</span>
          <div className="type-toggle">
            {BOTTLE_TYPES.map((t) => (
              <button type="button" key={t} className={type === t ? "active" : ""} onClick={() => setType(t)}>
                {typeIcon(t)} {typeLabel(t)}
              </button>
            ))}
          </div>
        </div>

        <label className="field full">
          <span>Name</span>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </label>

        <label className="field">
          <span>Producer</span>
          <input value={form.producer} onChange={(e) => update("producer", e.target.value)} />
        </label>

        <label className="field">
          <span>Country</span>
          <input value={form.country} onChange={(e) => update("country", e.target.value)} />
        </label>

        {VINTAGE_TYPES.includes(type) && (
          <label className="field">
            <span>Vintage</span>
            <input type="number" value={form.vintage} onChange={(e) => update("vintage", e.target.value)} />
          </label>
        )}

        {SPIRIT_TYPES.includes(type) && (
          <label className="field">
            <span>Proof</span>
            <input type="number" value={form.proof} onChange={(e) => update("proof", e.target.value)} />
          </label>
        )}

        <label className="field">
          <span>{VINTAGE_TYPES.includes(type) || type === "sparkling wine" ? "Varietal / style" : "Style"}</span>
          <select value={form.spirit_type} onChange={(e) => update("spirit_type", e.target.value)}>
            <option value="">Select style</option>
            {STYLE_OPTIONS[type].map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <div className="field-row">
          <label className="field">
            <span>Quantity</span>
            <input
              type="number"
              min={0}
              required
              value={form.quantity}
              onChange={(e) => update("quantity", Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Volume (ml)</span>
            <input type="number" value={form.volume_ml} onChange={(e) => update("volume_ml", e.target.value)} />
          </label>
        </div>

        <label className="field">
          <span>Purchase price</span>
          <input
            type="number"
            step="0.01"
            value={form.purchase_price}
            onChange={(e) => update("purchase_price", e.target.value)}
          />
        </label>

        <label className="field full">
          <span>Notes</span>
          <textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </label>

        {form.image_url && (
          <div className="field full image-preview">
            <img src={form.image_url} alt={form.name || "Bottle preview"} />
          </div>
        )}

        {form.barcode && <p className="barcode-tag">Barcode: {form.barcode}</p>}
        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : mode === "edit" ? "Save changes" : "Save bottle"}
          </button>
        </div>
      </form>
    </div>
  );
}
