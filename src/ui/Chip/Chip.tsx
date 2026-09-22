import type { ButtonHTMLAttributes, ReactNode } from "react";
import s from "./Chip.module.css";

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  count?: number;
  children: ReactNode;
}

export function Chip({ active = false, count, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      className={active ? `${s.chip} ${s.active}` : s.chip}
      aria-pressed={active}
      {...rest}
    >
      <span className={s.label}>{children}</span>
      {count !== undefined && (
        <span className={s.count}>
          {"· "}
          {count}
        </span>
      )}
    </button>
  );
}
