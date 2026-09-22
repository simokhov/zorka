import type { ReactNode } from "react";
import s from "./Chip.module.css";

export function ChipRow({ children }: { children: ReactNode }) {
  return <div className={s.row}>{children}</div>;
}
