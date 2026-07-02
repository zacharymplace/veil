type StatusPillProps = {
  label: string;
  value: string;
};

export function StatusPill({ label, value }: StatusPillProps) {
  return (
    <div className="status-pill">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
