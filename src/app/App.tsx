import { Route, Routes } from "react-router-dom";
import { GalleryPage } from "../features/dev/GalleryPage";

function HomePage() {
  return (
    <main>
      <h1>Зорька</h1>
      <p>Главная появится на этапах 3–4.</p>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dev/gallery" element={<GalleryPage />} />
    </Routes>
  );
}
