import { Icon } from "../icons/Icon";
import s from "./SyncBadge.module.css";

export type SyncBadgeState = "pending" | "syncing" | "synced" | "error";

export interface SyncBadgeProps {
  state: SyncBadgeState;
  onRetry?: () => void;
}

export function SyncBadge({ state, onRetry }: SyncBadgeProps) {
  if (state === "synced") {
    return (
      <span className={`${s.badge} ${s.synced}`}>
        <Icon name="check" size={16} />
        Синхронизировано
      </span>
    );
  }

  if (state === "syncing") {
    return (
      <span className={`${s.badge} ${s.syncing}`}>
        <Icon name="spinner" size={16} className={s.spinner} />
        Отправляем…
      </span>
    );
  }

  if (state === "pending") {
    return (
      <span className={`${s.badge} ${s.pending}`}>
        <Icon name="clock" size={16} className={s.pendingIcon} />
        Ждёт отправки
      </span>
    );
  }

  return (
    <span className={`${s.badge} ${s.error}`}>
      <Icon name="wifi-off" size={16} />
      Не отправлено
      {onRetry !== undefined && (
        <>
          <span aria-hidden="true">·</span>
          <button type="button" className={s.retry} onClick={onRetry}>
            Повторить
          </button>
        </>
      )}
    </span>
  );
}
