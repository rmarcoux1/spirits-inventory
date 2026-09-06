import { useState } from "react";

interface ScannableItem {
  id: string;
  name: string;
  barcode: string | null;
  quantity: number;
}

interface Props<T extends ScannableItem> {
  items: T[];
  onDecrement: (id: string) => void;
  itemLabel: string; // "bottle" | "item" — for status copy
}

// Matches a scanned/typed barcode against what's already loaded in
// inventory (client-side — the list is already in memory, so there's no
// need for a backend round-trip just to find a match) and decrements
// quantity by one. This is "I used one of these," as opposed to the
// add-item flow's barcode lookup, which looks up product info from
// UPCitemdb to help you add something new.
export function QuickScanDecrement<T extends ScannableItem>({ items, onDecrement, itemLabel }: Props<T>) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [statusKind, setStatusKind] = useState<"ok" | "warn">("ok");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    const match = items.find((i) => i.barcode === trimmed);
    if (!match) {
      setStatusKind("warn");
      setStatus(`No ${itemLabel} with that barcode in your inventory.`);
      setCode("");
      return;
    }

    if (match.quantity <= 0) {
      setStatusKind("warn");
      setStatus(`${match.name} is already at 0.`);
      setCode("");
      return;
    }

    onDecrement(match.id);
    setStatusKind("ok");
    setStatus(`${match.name}: ${match.quantity} → ${match.quantity - 1}`);
    setCode("");
  }

  return (
    <div className="quick-scan-panel">
      <form onSubmit={handleSubmit} className="manual-barcode-row">
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          placeholder={`Scan or type a barcode to use one ${itemLabel}…`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button type="submit" className="btn-primary">
          Use one
        </button>
      </form>
      {status && <p className={`scan-status${statusKind === "warn" ? " scan-status--warn" : ""}`}>{status}</p>}
    </div>
  );
}
