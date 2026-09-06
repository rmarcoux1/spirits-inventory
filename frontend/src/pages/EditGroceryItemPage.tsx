import { useParams } from "react-router-dom";
import { GroceryItemForm } from "../components/GroceryItemForm";
import { useGroceryItems } from "../hooks/useGroceryItems";

export default function EditGroceryItemPage() {
  const { id } = useParams<{ id: string }>();
  const { items, loading, error, editItem } = useGroceryItems();
  const item = items.find((i) => i.id === id);

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

  if (!item) {
    return (
      <div className="page">
        <p className="state-message state-message--error">Couldn't find that item.</p>
      </div>
    );
  }

  return (
    <div className="page">
      <GroceryItemForm mode="edit" initial={item} onSubmit={(payload) => editItem(item.id, payload)} />
    </div>
  );
}
