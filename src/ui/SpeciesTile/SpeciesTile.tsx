import type { ReactNode } from "react";
import { Icon } from "../icons/Icon";
import type { IconName } from "../icons/Icon";
import s from "./SpeciesTile.module.css";

export interface SpeciesTileProps {
  label: string;
  icon?: IconName;
  variant?: "blue" | "alt";
  selected?: boolean;
  onToggle?: () => void;
  badge?: ReactNode;
}

export function SpeciesTile({
  label,
  icon = "fish",
  variant = "blue",
  selected = false,
  onToggle,
  badge,
}: SpeciesTileProps) {
  const className = [
    s.tile,
    variant === "alt" ? s.alt : "",
    selected ? s.selected : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      className={className}
      aria-pressed={selected}
      onClick={onToggle}
    >
      <Icon name={icon} size={24} className={s.icon} />
      <span className={s.label}>{label}</span>
      {badge}
    </button>
  );
}
