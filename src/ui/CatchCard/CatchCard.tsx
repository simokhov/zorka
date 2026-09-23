import { useCallback } from "react";
import type { KeyboardEvent, MouseEventHandler, ReactNode } from "react";
import { Icon } from "../icons/Icon";
import type { IconName } from "../icons/Icon";
import s from "./CatchCard.module.css";

export interface CatchCardProps {
  species: string;
  weight?: string | undefined;
  photo?: { src: string; alt: string };
  metadata?: string[];
  badge?: ReactNode;
  trophy?: boolean;
  icon?: IconName;
  /**
   * Вызывается при клике/тапе по карточке и по нажатию Enter/Space.
   * Корень карточки — div с role="button" (не <button>), чтобы вложенные
   * интерактивные элементы (например, кнопка «Повторить» в SyncBadge)
   * оставались валидной разметкой без вложения интерактивных контролов.
   */
  onClick?: () => void;
}

export function CatchCard({
  species,
  weight,
  photo,
  metadata = [],
  badge,
  trophy = false,
  icon = "fish",
  onClick,
}: CatchCardProps) {
  const handleClick: MouseEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (onClick === undefined) return;
      const target = event.target as HTMLElement;
      if (target.closest("button") !== null) return;
      onClick();
    },
    [onClick],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (onClick === undefined) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const target = event.target as HTMLElement;
        if (target.closest("button") !== null) return;
        onClick();
      }
    },
    [onClick],
  );

  return (
    <div
      className={s.card}
      role={onClick === undefined ? undefined : "button"}
      tabIndex={onClick === undefined ? undefined : 0}
      onClick={onClick === undefined ? undefined : handleClick}
      onKeyDown={onClick === undefined ? undefined : handleKeyDown}
    >
      {photo ? (
        <img src={photo.src} alt={photo.alt} className={s.photo} />
      ) : (
        <span className={`${s.media} ${s.placeholder}`}>
          <Icon name={icon} size={24} className={s.placeholderIcon} />
        </span>
      )}
      <span className={s.body}>
        <span className={s.speciesRow}>
          <span className={s.species}>{species}</span>
          {weight !== undefined && <span className={s.weight}>{weight}</span>}
        </span>
        {metadata.length > 0 && (
          <span className={s.metadata}>{metadata.join(" · ")}</span>
        )}
        {(badge !== undefined || trophy) && (
          <span className={s.badgeRow}>
            {badge}
            {trophy && (
              <span className={s.trophy}>
                <Icon name="trophy" size={16} /> Трофей
              </span>
            )}
          </span>
        )}
      </span>
    </div>
  );
}
