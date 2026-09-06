import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { type Bottle, typeLabel } from "../api";

const COLORS: Record<string, string> = {
  wine: "#e8491d",
  champagne: "#ff4f81",
  "sparkling wine": "#0ea394",
  whiskey: "#f2a93b",
  vodka: "#eb9d2e",
  gin: "#e4a856",
  rum: "#d68a1f",
  tequila: "#f5b94a",
  brandy: "#c77e14",
  mezcal: "#e0993a",
  liqueur: "#f2b45e",
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
