type ProtectionRowProps = {
  label: string;
  description: string;
  enabled: boolean;
};

export function ProtectionRow({ label, description, enabled }: ProtectionRowProps) {
  return (
    <div className="protection-row">
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <span className={enabled ? "badge on" : "badge off"}>
        {enabled ? "On" : "Off"}
      </span>
    </div>
  );
}
