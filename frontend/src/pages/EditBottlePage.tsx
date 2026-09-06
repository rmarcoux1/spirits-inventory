import { useParams } from "react-router-dom";
import { BottleForm } from "../components/BottleForm";
import { useBottles } from "../hooks/useBottles";

export default function EditBottlePage() {
  const { id } = useParams<{ id: string }>();
  const { bottles, loading, error, editBottle } = useBottles();
  const bottle = bottles.find((b) => b.id === id);

  if (loading) {
    return (
      <div className="page">
        <p className="state-message">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <p className="state-message state-message--error">{error}</p>
      </div>
    );
  }

  if (!bottle) {
    return (
      <div className="page">
        <p className="state-message state-message--error">Couldn't find that bottle.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <BottleForm mode="edit" initial={bottle} onSubmit={(payload) => editBottle(bottle.id, payload)} />
    </div>
  );
}
