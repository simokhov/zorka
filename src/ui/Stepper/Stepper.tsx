import { Icon } from "../icons/Icon";
import s from "./Stepper.module.css";

export interface StepperProps {
  label: string;
  value?: number | null;
  unit: string;
  step?: number;
  min?: number;
  max?: number;
  error?: string;
  onChange?: (value: number | null) => void;
  onValueInput?: (value: number | null) => void;
}

export function Stepper({
  label,
  value = null,
  unit,
  step = 1,
  min,
  max,
  error,
  onChange,
  onValueInput,
}: StepperProps) {
  const clamp = (next: number): number => {
    if (min !== undefined && next < min) return min;
    if (max !== undefined && next > max) return max;
    return next;
  };

  const canDecrement =
    value !== null && (min === undefined || value - step >= min);
  const canIncrement =
    value === null || max === undefined || value + step <= max;

  const change = (delta: number) => {
    if (value === null) {
      if (delta > 0) onChange?.(clamp(step));
      return;
    }
    const next = clamp(value + delta);
    if (next !== value) onChange?.(next);
  };

  return (
    <div className={s.wrapper}>
      <div className={s.stepper} role="group" aria-label={`${label} (${unit})`}>
        <button
          type="button"
          className={s.button}
          onClick={() => change(-step)}
          disabled={!canDecrement}
          aria-label={`Уменьшить: ${label}`}
        >
          <Icon name="minus" size={20} />
        </button>
        <div className={s.value}>
          {value === null ? (
            <span className={s.empty}>—</span>
          ) : (
            <>
              <input
                type="number"
                className={s.input}
                value={value}
                min={min}
                max={max}
                step={step}
                aria-label={label}
                onChange={(e) => {
                  const raw = e.target.value;
                  onValueInput?.(raw === "" ? null : Number(raw));
                }}
              />
              <span className={s.unit}>{unit}</span>
            </>
          )}
        </div>
        <button
          type="button"
          className={s.button}
          onClick={() => change(step)}
          disabled={!canIncrement}
          aria-label={`Увеличить: ${label}`}
        >
          <Icon name="plus" size={20} />
        </button>
      </div>
      {error !== undefined && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
