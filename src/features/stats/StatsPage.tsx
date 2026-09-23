import { EmptyState } from "../../ui";
import { AppLayout } from "../../app/AppLayout";

/** Этап 4: каркас «Итогов» (макет 04 — заголовок; агрегация появится после записи поимок). */
export function StatsPage() {
  return (
    <AppLayout title="Статистика" subtitle="Ваш сезон в цифрах">
      <EmptyState
        icon="trophy"
        title="Статистики пока нет"
        description="Запишите первую поимку — сезон начнёт собираться в цифры."
      />
    </AppLayout>
  );
}
