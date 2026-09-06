import { GroceryItemForm } from "../components/GroceryItemForm";
import { useGroceryItems } from "../hooks/useGroceryItems";

export default function AddGroceryItemPage() {
  const { addItem } = useGroceryItems();

  return (
    <div className="page">
      <GroceryItemForm mode="add" onSubmit={addItem} />
    </div>
  );
}
