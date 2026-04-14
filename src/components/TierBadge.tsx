import { TIER_COLORS, TIER_LABELS } from "@/lib/tierScore";

interface TierBadgeProps {
  tier: string | null;
  rank: string | null;
  lp?: number | null;
  size?: "sm" | "md" | "lg";
}

export default function TierBadge({
  tier,
  rank,
  lp,
  size = "md",
}: TierBadgeProps) {
  const t = tier || "UNRANKED";
  const colorClass = TIER_COLORS[t] || TIER_COLORS.UNRANKED;
  const label = TIER_LABELS[t] || t;
  const isHighTier =
    t === "MASTER" || t === "GRANDMASTER" || t === "CHALLENGER";

  const sizeClass = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${colorClass} ${sizeClass}`}>
      {label}
      {!isHighTier && rank && ` ${rank}`}
      {lp !== undefined && lp !== null && isHighTier && ` ${lp}LP`}
    </span>
  );
}
