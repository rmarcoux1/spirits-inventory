import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { type GroceryItem, type GroceryCategory } from "../groceryApi";

const COLORS: Record<GroceryCategory, string> = {
  produce: "#7ca089",
  "dairy & eggs": "#d9b466",
  "meat & seafood": "#9c3142",
  bakery: "#c98f4c",
  pantry: "#cf9138",
  frozen: "#6a8caf",
  beverages: "#5e9c8f",
  beer: "#b8863e",
  snacks: "#b87f30",
  household: "#8a7d6c",
  "personal care": "#a08cae",
  other: "#7a6a4c",
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
            background: "#17301f",
            border: "1px solid #2c4a34",
            borderRadius: 8,
            color: "#f3ead2",
            fontSize: 13,
          }}
          itemStyle={{ color: "#f3ead2" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
