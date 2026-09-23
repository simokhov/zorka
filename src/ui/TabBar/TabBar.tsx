import { NavLink } from "react-router-dom";
import { Icon } from "../icons/Icon";
import type { IconName } from "../icons/Icon";
import s from "./TabBar.module.css";

export interface TabBarItem {
  to: string;
  label: string;
  icon: IconName;
  badge?: number | undefined;
}

export type TabBarCenterItem = Omit<TabBarItem, "badge">;

export interface TabBarProps {
  items?: TabBarItem[];
  centerItem?: TabBarCenterItem;
}

function TabLink({ item }: { item: TabBarItem }) {
  const badge = item.badge ?? 0;
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        [s.item, isActive ? s.active : ""].filter(Boolean).join(" ")
      }
    >
      <span className={s.iconWrap}>
        <Icon name={item.icon} size={24} />
        {badge > 1 ? (
          <span
            className={s.badgeCount}
            role="img"
            aria-label={`Записей в очереди: ${badge}`}
          >
            {badge}
          </span>
        ) : badge === 1 ? (
          <span
            className={s.badgeDot}
            role="img"
            aria-label="Записей в очереди: 1"
          />
        ) : null}
      </span>
      <span className={s.label}>{item.label}</span>
    </NavLink>
  );
}

export function TabBar({ items = [], centerItem }: TabBarProps) {
  const center: TabBarCenterItem = centerItem ?? {
    to: "/record",
    label: "Запись",
    icon: "plus",
  };
  const left = items.slice(0, Math.ceil(items.length / 2));
  const right = items.slice(Math.ceil(items.length / 2));
  return (
    <nav aria-label="Основная навигация" className={s.nav}>
      <div className={s.inner}>
        {left.map((item) => (
          <TabLink key={item.to} item={item} />
        ))}
        <NavLink
          to={center.to}
          aria-label={center.label}
          className={[s.centerLink].filter(Boolean).join(" ")}
        >
          <Icon name={center.icon} size={24} />
        </NavLink>
        {right.map((item) => (
          <TabLink key={item.to} item={item} />
        ))}
      </div>
    </nav>
  );
}
