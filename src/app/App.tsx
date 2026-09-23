import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { GalleryPage } from "../features/dev/GalleryPage";
import { LoginPage } from "../features/auth/LoginPage";
import { RegisterPage } from "../features/auth/RegisterPage";
import { FeedPage } from "../features/catches/FeedPage";
import { RecordPage } from "../features/catches/RecordPage";
import { MapPage } from "../features/map/MapPage";
import { StatsPage } from "../features/stats/StatsPage";
import { ProtectedRoute, RedirectIfAuthenticated } from "./AppLayout";
import { useSessionStore } from "../features/auth/sessionStore";

export function App() {
  const initialize = useSessionStore((st) => st.initialize);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <Routes>
      <Route path="/dev/gallery" element={<GalleryPage />} />

      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <LoginPage />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthenticated>
            <RegisterPage />
          </RedirectIfAuthenticated>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<FeedPage />} />
        <Route path="/record" element={<RecordPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
