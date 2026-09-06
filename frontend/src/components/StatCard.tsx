interface Props {
  label: string;
  value: string;
}

export function StatCard({ label, value }: Props) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}
