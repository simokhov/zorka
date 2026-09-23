import { Icon, type IconName } from "../icons/Icon";
import s from "./EmptyState.module.css";

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Пустое состояние по канону §7.4: иконка + заголовок + пояснение + одно действие. */
export function EmptyState({
  icon = "fish",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className={s.wrap}>
      <Icon name={icon} size={24} />
      <h3 className={s.title}>{title}</h3>
      {description !== undefined && (
        <p className={s.description}>{description}</p>
      )}
      {action}
    </div>
  );
}
