export default function SignalMeter({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const bars = 4;
  const lit = Math.max(1, Math.round((score / 10) * bars));
  const barWidth = size === "lg" ? 4 : 3;
  const gap = size === "lg" ? 2 : 1.5;
  const heights = size === "lg" ? [8, 13, 18, 23] : [6, 10, 14, 18];

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="flex items-end" style={{ gap }}>
        {heights.map((h, i) => (
          <div
            key={i}
            className="rounded-sm"
            style={{
              width: barWidth,
              height: h,
              background: i < lit ? "var(--brand-pink)" : "var(--border)",
            }}
          />
        ))}
      </div>
      <span className={size === "lg" ? "text-base font-semibold" : "text-sm font-semibold"}>{score}</span>
    </div>
  );
}
