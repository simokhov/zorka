import { Icon } from "../icons/Icon";
import type { IconName } from "../icons/Icon";
import s from "./WeatherLine.module.css";

export type WeatherLineState =
  | { kind: "data"; temperature: string; details?: string[]; icon?: IconName }
  | { kind: "missing" }
  | { kind: "loading" };

export interface WeatherLineProps {
  state: WeatherLineState;
}

export function WeatherLine({ state }: WeatherLineProps) {
  if (state.kind === "loading") {
    return (
      <div role="status" aria-label="Загрузка погоды" className={s.skeleton} />
    );
  }

  if (state.kind === "missing") {
    return (
      <div role="status" className={`${s.line} ${s.missing}`}>
        Погода не записана
      </div>
    );
  }

  return (
    <div role="status" className={s.line}>
      <Icon name={state.icon ?? "cloud"} size={16} className={s.icon} />
      <span className={s.temperature}>{state.temperature}</span>
      {state.details !== undefined && state.details.length > 0 && (
        <>
          <span aria-hidden="true" className={s.dot}>
            ·
          </span>
          <span className={s.detail}>{state.details.join(" · ")}</span>
        </>
      )}
    </div>
  );
}
