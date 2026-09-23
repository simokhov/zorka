import { EmptyState } from "../../ui";
import { AppLayout } from "../../app/AppLayout";

/** Этап 4: каркас «Карты» (макет 03 — заголовок; карта — фаза 2, нужен ключ Яндекс.Карт). */
export function MapPage() {
  return (
    <AppLayout
      title="Карта и места"
      subtitle="Точки, к которым хочется вернуться"
    >
      <EmptyState
        icon="map-pin"
        title="Карта появится позже"
        description="Сохраняйте места — они отобразятся на карте в следующем этапе."
      />
    </AppLayout>
  );
}
