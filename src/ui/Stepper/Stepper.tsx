import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Icon } from "../icons/Icon";
import s from "./Stepper.module.css";

const HOLD_DELAY_MS = 500;
const INITIAL_INTERVAL_MS = 250;
const MIN_INTERVAL_MS = 60;
const ACCELERATION_FACTOR = 0.8;

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
  const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heldRef = useRef(false);
  const changeRef = useRef<(delta: number) => void>(() => undefined);
  const [pressed, setPressed] = useState<"minus" | "plus" | null>(null);

  const clamp = useCallback(
    (next: number): number => {
      if (min !== undefined && next < min) return min;
      if (max !== undefined && next > max) return max;
      return next;
    },
    [min, max],
  );

  const change = (delta: number) => {
    if (value === null) {
      if (delta > 0) onChange?.(clamp(step));
      return;
    }
    const next = clamp(value + delta);
    if (next !== value) onChange?.(next);
  };
  useEffect(() => {
    changeRef.current = change;
  });

  const stopHold = useCallback(() => {
    if (holdTimeout.current !== null) {
      clearTimeout(holdTimeout.current);
      holdTimeout.current = null;
    }
    setPressed(null);
  }, []);

  useEffect(() => stopHold, [stopHold]);

  const handleStop = useCallback(() => {
    stopHold();
  }, [stopHold]);

  const startHold = useCallback((delta: number) => {
    heldRef.current = false;
    let interval = INITIAL_INTERVAL_MS;
    let heldMs = 0;
    const tick = () => {
      heldRef.current = true;
      changeRef.current(delta);
      heldMs += interval;
      if (heldMs >= HOLD_DELAY_MS) {
        interval = Math.max(MIN_INTERVAL_MS, interval * ACCELERATION_FACTOR);
      }
      holdTimeout.current = setTimeout(tick, interval);
    };
    holdTimeout.current = setTimeout(tick, INITIAL_INTERVAL_MS);
  }, []);

  const canDecrement =
    value !== null && (min === undefined || value - step >= min);
  const canIncrement =
    value === null || max === undefined || value + step <= max;

  const handlePointerDown =
    (key: "minus" | "plus", delta: number) =>
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0) return;
      setPressed(key);
      startHold(delta);
    };

  const handleClick = (delta: number) => () => {
    if (heldRef.current) {
      heldRef.current = false;
      return;
    }
    change(delta);
  };

  return (
    <div className={s.wrapper}>
      <div className={s.stepper} role="group" aria-label={`${label} (${unit})`}>
        <button
          type="button"
          className={s.button}
          disabled={!canDecrement}
          aria-label={`Уменьшить: ${label}`}
          {...(pressed === "minus" ? { "data-pressed": "" } : {})}
          onPointerDown={handlePointerDown("minus", -step)}
          onPointerUp={handleStop}
          onPointerCancel={handleStop}
          onPointerLeave={handleStop}
          onClick={handleClick(-step)}
        >
          <Icon name="minus" size={20} />
        </button>
        <div className={s.value}>
          <input
            type="number"
            className={s.input}
            value={value ?? ""}
            placeholder="—"
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
        </div>
        <button
          type="button"
          className={s.button}
          disabled={!canIncrement}
          aria-label={`Увеличить: ${label}`}
          {...(pressed === "plus" ? { "data-pressed": "" } : {})}
          onPointerDown={handlePointerDown("plus", step)}
          onPointerUp={handleStop}
          onPointerCancel={handleStop}
          onPointerLeave={handleStop}
          onClick={handleClick(step)}
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
