import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { type GroceryItem, type GroceryCategory } from "../groceryApi";

const COLORS: Record<GroceryCategory, string> = {
  produce: "#0ea394",
  "dairy & eggs": "#f2a93b",
  "meat & seafood": "#e8491d",
  bakery: "#f2b45e",
  pantry: "#c77e14",
  frozen: "#4f9fd6",
  beverages: "#39c0ac",
  beer: "#eb9d2e",
  snacks: "#ff4f81",
  household: "#a08cae",
  "personal care": "#d67aa3",
  other: "#8c7358",
};

export function CategoryBreakdownChart({ items }: { items: GroceryItem[] }) {
  const totals = new Map<string, number>();
  for (const i of items) {
    totals.set(i.category, (totals.get(i.category) ?? 0) + 1);
  }
  const data = Array.from(totals.entries())
    .filter(([, value]) => value > 0)
    .map(([category, value]) => ({ name: category, category, value }));

  if (data.length === 0) {
    return <p className="chart-empty">Add items to see the breakdown.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
          {data.map((entry) => (
            <Cell key={entry.category} fill={COLORS[entry.category as GroceryCategory] ?? "#8a7d6c"} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#ffffff",
            border: "1px solid #e8d2a0",
            borderRadius: 8,
            color: "#2a1b10",
            fontSize: 13,
          }}
          itemStyle={{ color: "#2a1b10" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
