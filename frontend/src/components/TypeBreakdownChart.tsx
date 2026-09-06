import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { type Bottle, typeLabel } from "../api";

const COLORS: Record<string, string> = {
  wine: "#9c3142",
  champagne: "#d9b466",
  "sparkling wine": "#7ca089",
  whiskey: "#cf9138",
  vodka: "#b87f30",
  gin: "#c4954a",
  rum: "#a86b26",
  tequila: "#d4a44f",
  brandy: "#9c6b28",
  mezcal: "#bf8c3e",
  liqueur: "#ce9a4a",
};

export function TypeBreakdownChart({ bottles }: { bottles: Bottle[] }) {
  const totals = new Map<string, number>();
  for (const b of bottles) {
    totals.set(b.type, (totals.get(b.type) ?? 0) + b.quantity);
  }
  const data = Array.from(totals.entries())
    .filter(([, value]) => value > 0)
    .map(([type, value]) => ({ name: typeLabel(type as Bottle["type"]), type, value }));

  if (data.length === 0) {
    return <p className="chart-empty">Add bottles to see the breakdown.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
          {data.map((entry) => (
            <Cell key={entry.type} fill={COLORS[entry.type] ?? "#8a7d6c"} />
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
