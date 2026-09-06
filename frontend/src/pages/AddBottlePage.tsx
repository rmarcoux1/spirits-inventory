import { BottleForm } from "../components/BottleForm";
import { useBottles } from "../hooks/useBottles";

export default function AddBottlePage() {
  const { addBottle } = useBottles();

  return (
    <div className="page">
      <BottleForm mode="add" onSubmit={addBottle} />
    </div>
  );
}
