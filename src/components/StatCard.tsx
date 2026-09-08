export default function StatCard({
  label,
  value,
  color,
  hint,
}: {
  label: string;
  value: string | number;
  color?: string;
  hint?: string;
}) {
  const isLongText = typeof value === "string" && value.length > 4;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p
        className={isLongText ? "text-base font-semibold leading-snug" : "text-2xl font-semibold"}
        style={color ? { color } : undefined}
      >
        {value}
      </p>
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  );
}
