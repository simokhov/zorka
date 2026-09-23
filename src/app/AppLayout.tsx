import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { TabBar } from "../ui";
import { useSessionStore } from "../features/auth/sessionStore";
import s from "./AppLayout.module.css";

/** Каркас защищённой части: шапка экрана, оффлайн-баннер (этап 5 подключит live-состояние), таб-бар. */
export function AppLayout({
  title,
  subtitle,
  banner,
  children,
}: {
  title: string;
  subtitle?: string;
  banner?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={s.shell}>
      <header className={s.header}>
        <h1 className={s.title}>{title}</h1>
        {subtitle !== undefined && <p className={s.subtitle}>{subtitle}</p>}
      </header>
      {banner !== undefined && <div className={s.bannerWrap}>{banner}</div>}
      {children}
      <TabBar
        items={[
          { to: "/", label: "Лента", icon: "feed" },
          { to: "/map", label: "Карта", icon: "map-pin" },
          { to: "/stats", label: "Итоги", icon: "trophy" },
        ]}
      />
    </div>
  );
}

/** Protected route: ожидание инициализации сессии, затем редирект на /login. */
export function ProtectedRoute() {
  const status = useSessionStore((st) => st.status);
  if (status === "loading") return null;
  if (status === "anonymous") return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Перенаправляет авторизованного пользователя с auth-экранов внутрь приложения. */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const status = useSessionStore((st) => st.status);
  if (status === "authenticated") return <Navigate to="/" replace />;
  return <>{children}</>;
}
