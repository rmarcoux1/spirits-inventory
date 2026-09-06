import { useState } from "react";
import { Link } from "react-router-dom";
import { type Bottle, typeIcon, typeLabel } from "../api";

interface Props {
  bottle: Bottle;
  onAdjustQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
}

export function BottleCard({ bottle, onAdjustQuantity, onRemove }: Props) {
  const [flipped, setFlipped] = useState(false);
  const subtitle = [bottle.vintage, bottle.country].filter(Boolean).join(" · ");
  const typeClass = bottle.type.replace(" ", "-");

  function stop(e: React.MouseEvent | React.KeyboardEvent) {
    e.stopPropagation();
  }

  return (
    <div className={`bottle-card-flip bottle-card-flip--${typeClass}${flipped ? " flipped" : ""}`}>
      <div className="bottle-card-inner">
        {/* Front — the label you'd see on the shelf */}
        <article className="bottle-card-face bottle-card-face--front">
          <button
            className="flip-tab"
            onClick={() => setFlipped(true)}
            aria-label={`Show details for ${bottle.name}`}
            title="Show more"
          >
            ⁂
          </button>

          <div className="bottle-card-media" aria-hidden="true">
            {bottle.image_url ? <img src={bottle.image_url} alt="" /> : typeIcon(bottle.type)}
          </div>

          <div className="bottle-card-body">
            <span className="type-tag">
              {typeIcon(bottle.type)} {typeLabel(bottle.type)}
            </span>
            <h3>{bottle.name}</h3>
            {bottle.producer && <p className="bottle-card-producer">{bottle.producer}</p>}
            {subtitle && <p className="bottle-card-subtitle">{subtitle}</p>}
            {bottle.spirit_type && <p className="bottle-card-varietal">{bottle.spirit_type}</p>}

            <div className="bottle-card-footer">
              <div className="qty-control" onClick={stop}>
                <button aria-label="Decrease quantity" onClick={() => onAdjustQuantity(bottle.id, -1)}>
                  −
                </button>
                <span>{bottle.quantity}</span>
                <button aria-label="Increase quantity" onClick={() => onAdjustQuantity(bottle.id, 1)}>
                  +
                </button>
              </div>
              {bottle.purchase_price != null && (
                <span className="bottle-card-price">${bottle.purchase_price.toLocaleString()}</span>
              )}
            </div>
          </div>
        </article>

        {/* Back — the fine print */}
        <article className="bottle-card-face bottle-card-face--back">
          <button
            className="flip-tab"
            onClick={() => setFlipped(false)}
            aria-label="Back to front"
            title="Back to front"
          >
            ↺
          </button>

          <div className="bottle-card-back-content">
            <h4>{bottle.name}</h4>
            <dl className="spec-list">
              {bottle.proof != null && (
                <>
                  <dt>Proof</dt>
                  <dd>{bottle.proof}</dd>
                </>
              )}
              {bottle.volume_ml != null && (
                <>
                  <dt>Volume</dt>
                  <dd>{bottle.volume_ml}ml</dd>
                </>
              )}
              {bottle.purchase_price != null && (
                <>
                  <dt>Paid</dt>
                  <dd>${bottle.purchase_price.toLocaleString()}</dd>
                </>
              )}
              {bottle.country && (
                <>
                  <dt>Origin</dt>
                  <dd>{bottle.country}</dd>
                </>
              )}
              {bottle.barcode && (
                <>
                  <dt>Barcode</dt>
                  <dd>{bottle.barcode}</dd>
                </>
              )}
            </dl>
            {bottle.notes && <p className="bottle-card-notes">{bottle.notes}</p>}
          </div>

          <div className="bottle-card-back-actions">
            <Link to={`/edit/${bottle.id}`} className="btn-ghost" onClick={stop}>
              Edit
            </Link>
            <button
              className="btn-ghost btn-remove"
              onClick={(e) => {
                stop(e);
                onRemove(bottle.id);
              }}
            >
              Remove
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
