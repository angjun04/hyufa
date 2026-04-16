import { POSITIONS } from "@/lib/tierScore";

interface PositionBadgeProps {
  position: string;
  size?: "sm" | "md";
}

export default function PositionBadge({ position, size = "sm" }: PositionBadgeProps) {
  const pos = POSITIONS.find((p) => p.value === position);
  if (!pos) return null;

  const sz = size === "md" ? "text-xs px-2 py-1" : "text-[11px] px-1.5 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1 bg-[#1a1e25] border border-[#232830] text-[#a3a8b3] rounded ${sz}`}
    >
      <span>{pos.icon}</span>
      <span>{pos.label}</span>
    </span>
  );
}
