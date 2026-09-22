import { Icon } from "../icons/Icon";
import s from "./OfflineBanner.module.css";

export interface OfflineBannerProps {
  title?: string;
  description?: string;
}

export function OfflineBanner({
  title = "Нет сети",
  description = "Запись сохранится на устройстве и отправится при появлении связи",
}: OfflineBannerProps) {
  return (
    <div role="status" className={s.banner}>
      <Icon name="wifi-off" size={20} className={s.icon} />
      <div className={s.text}>
        <p className={s.title}>{title}</p>
        <p className={s.description}>{description}</p>
      </div>
    </div>
  );
}
