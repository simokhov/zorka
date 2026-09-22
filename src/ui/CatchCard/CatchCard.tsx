import type { ReactNode } from "react";
import { Icon } from "../icons/Icon";
import type { IconName } from "../icons/Icon";
import s from "./CatchCard.module.css";

export interface CatchCardProps {
  species: string;
  weight?: string;
  photo?: { src: string; alt: string };
  metadata?: string[];
  badge?: ReactNode;
  trophy?: boolean;
  icon?: IconName;
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
  return (
    <button
      type="button"
      className={s.card}
      onClick={onClick}
      aria-label={photo ? photo.alt : species}
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
    </button>
  );
}
