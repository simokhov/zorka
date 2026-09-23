import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { OfflineBanner, TabBar } from "../ui";
import { db } from "../data/db";
import { useSessionStore } from "../features/auth/sessionStore";
import { useOnline } from "../features/sync/useOnline";
import s from "./AppLayout.module.css";

/** Каркас защищённой части: шапка, оффлайн-баннер (§6.6), таб-бар со счётчиком очереди. */
export function AppLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string | undefined;
  children: ReactNode;
}) {
  const online = useOnline();
  const pendingCount = useLiveQuery(
    () =>
      db.catches
        .where("syncState")
        .anyOf(["pending", "syncing", "error"])
        .count(),
    [],
    0,
  );

  return (
    <div className={s.shell}>
      <header className={s.header}>
        <h1 className={s.title}>{title}</h1>
        {subtitle !== undefined && <p className={s.subtitle}>{subtitle}</p>}
      </header>
      {!online && (
        <div className={s.bannerWrap}>
          <OfflineBanner />
        </div>
      )}
      {children}
      <TabBar
        items={[
          {
            to: "/",
            label: "Лента",
            icon: "feed",
            badge: pendingCount > 0 ? pendingCount : undefined,
          },
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
