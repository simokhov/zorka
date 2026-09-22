import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "../icons/Icon";
import type { IconName } from "../icons/Icon";
import s from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "md" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: IconName;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled === true || loading;
  return (
    <button
      type="button"
      className={`${s.button} ${s[variant]} ${size === "sm" ? s.sm : ""}`}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Icon
          name="spinner"
          size={size === "sm" ? 16 : 20}
          className={s.spinner}
        />
      ) : (
        icon !== undefined && (
          <Icon name={icon} size={size === "sm" ? 16 : 20} />
        )
      )}
      {loading ? null : children}
    </button>
  );
}
