import { POSITIONS } from "@/lib/tierScore";

interface PositionBadgeProps {
  position: string;
}

export default function PositionBadge({ position }: PositionBadgeProps) {
  const pos = POSITIONS.find((p) => p.value === position);
  if (!pos) return null;

  return (
    <span className="inline-flex items-center gap-1 bg-gray-700 text-gray-200 text-xs px-2 py-1 rounded-md">
      <span>{pos.icon}</span>
      <span>{pos.label}</span>
    </span>
  );
}
