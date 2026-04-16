import { TIER_LABELS } from "@/lib/tierScore";

interface TierBadgeProps {
  tier: string | null;
  rank: string | null;
  lp?: number | null;
  size?: "xs" | "sm" | "md";
}

// op.gg/lol.ps 스타일 — 텍스트 색상으로 티어 표현 + 옅은 배경
const TIER_TEXT: Record<string, string> = {
  IRON: "text-[#86756a]",
  BRONZE: "text-[#a0723b]",
  SILVER: "text-[#9aa6ae]",
  GOLD: "text-[#d4a541]",
  PLATINUM: "text-[#3aa6a8]",
  EMERALD: "text-[#3aa86b]",
  DIAMOND: "text-[#5e9bff]",
  MASTER: "text-[#a070d6]",
  GRANDMASTER: "text-[#e3603f]",
  CHALLENGER: "text-[#f0c947]",
  UNRANKED: "text-[#6c727f]",
};

const TIER_DOT: Record<string, string> = {
  IRON: "bg-[#86756a]",
  BRONZE: "bg-[#a0723b]",
  SILVER: "bg-[#9aa6ae]",
  GOLD: "bg-[#d4a541]",
  PLATINUM: "bg-[#3aa6a8]",
  EMERALD: "bg-[#3aa86b]",
  DIAMOND: "bg-[#5e9bff]",
  MASTER: "bg-[#a070d6]",
  GRANDMASTER: "bg-[#e3603f]",
  CHALLENGER: "bg-gradient-to-r from-[#f0c947] to-[#e08a3c]",
  UNRANKED: "bg-[#3a414c]",
};

export default function TierBadge({
  tier,
  rank,
  lp,
  size = "sm",
}: TierBadgeProps) {
  const t = tier || "UNRANKED";
  const colorText = TIER_TEXT[t] || TIER_TEXT.UNRANKED;
  const dot = TIER_DOT[t] || TIER_DOT.UNRANKED;
  const label = TIER_LABELS[t] || t;
  const isHigh = t === "MASTER" || t === "GRANDMASTER" || t === "CHALLENGER";

  const sizeStyles = {
    xs: { box: "text-[10px] gap-1", dot: "w-1.5 h-1.5" },
    sm: { box: "text-[12px] gap-1.5", dot: "w-2 h-2" },
    md: { box: "text-sm gap-2", dot: "w-2.5 h-2.5" },
  }[size];

  return (
    <span
      className={`inline-flex items-center font-semibold tabular-nums ${colorText} ${sizeStyles.box}`}
    >
      <span className={`rounded-full ${sizeStyles.dot} ${dot}`} />
      <span>
        {label}
        {!isHigh && rank ? ` ${rank}` : ""}
        {isHigh && lp != null ? ` ${lp}LP` : ""}
      </span>
    </span>
  );
}
